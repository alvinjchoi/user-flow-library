import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAuth, requireProjectAccess } from "@/lib/api-auth";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Validate authentication
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Verify project access
    const project = await requireProjectAccess(projectId, authResult);
    if (project instanceof NextResponse) return project;

    // Fetch flows
    const { data: flows, error: flowsError } = await supabaseAdmin
      .from("flows")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (flowsError) {
      console.error("Error fetching flows:", flowsError);
      return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 });
    }

    // Fetch all screens for all flows
    const { data: screens, error: screensError } = await supabaseAdmin
      .from("screens")
      .select("*")
      .in("flow_id", flows?.map(f => f.id) || [])
      .order("order_index", { ascending: true });

    if (screensError) {
      console.error("Error fetching screens:", screensError);
      return NextResponse.json({ error: "Failed to fetch screens" }, { status: 500 });
    }

    // Group screens by flow
    const screensByFlow = (screens || []).reduce((acc, screen) => {
      if (!acc[screen.flow_id]) {
        acc[screen.flow_id] = [];
      }
      acc[screen.flow_id].push(screen);
      return acc;
    }, {} as Record<string, any[]>);

    // Check if Typst is installed
    try {
      await execAsync("typst --version");
    } catch (error) {
      console.error("Typst not installed");
      return NextResponse.json(
        { error: "Typst compiler not installed on server" },
        { status: 500 }
      );
    }

    // Download all images to temporary files and generate image map
    const { imageMap, timestamp } = await downloadImagesToTempFiles(screensByFlow);

    // Generate Typst document with local image paths
    const typstContent = generateTypstDocument(project, flows || [], screensByFlow, imageMap);

    // Compile Typst to PDF
    const pdfBuffer = await compileTypstToPDF(typstContent, project.name, imageMap, timestamp);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_flow.pdf"`,
      },
    });
  } catch (error) {
    console.error("[Export PDF] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function downloadImagesToTempFiles(
  screensByFlow: Record<string, any[]>
): Promise<{ imageMap: Map<string, string>; timestamp: number }> {
  const imageMap = new Map<string, string>();
  const tempDir = tmpdir();
  const timestamp = Date.now();

  // Collect all unique image URLs
  const imageUrls = new Set<string>();
  for (const screens of Object.values(screensByFlow)) {
    for (const screen of screens) {
      if (screen.screenshot_url) {
        imageUrls.add(screen.screenshot_url);
      }
    }
  }

  // Download each image
  let imageIndex = 0;
  for (const url of imageUrls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine file extension from content-type or URL
      let ext = "png";
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
        ext = "jpg";
      } else if (contentType?.includes("png")) {
        ext = "png";
      } else if (url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg")) {
        ext = "jpg";
      }

      // Save to temporary file with full path
      const filename = `${timestamp}_img_${imageIndex}.${ext}`;
      const tempFilePath = join(tempDir, filename);
      await writeFile(tempFilePath, buffer);
      
      // Store just the filename for relative path reference
      imageMap.set(url, filename);
      imageIndex++;
    } catch (error) {
      console.error(`Failed to download image ${url}:`, error);
      // Continue with other images
    }
  }

  return { imageMap, timestamp };
}

async function compileTypstToPDF(
  typstContent: string,
  projectName: string,
  imageMap: Map<string, string>,
  imagesTimestamp: number
): Promise<Buffer> {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const inputFile = join(tempDir, `${timestamp}_flow.typ`);
  const outputFile = join(tempDir, `${timestamp}_flow.pdf`);

  try {
    // Write Typst content to temporary file
    await writeFile(inputFile, typstContent, "utf-8");

    // Compile with Typst (images will be resolved relative to the typ file location)
    await execAsync(`typst compile "${inputFile}" "${outputFile}"`, {
      timeout: 30000, // 30 second timeout
    });

    // Read the generated PDF
    const pdfBuffer = await readFile(outputFile);

    // Cleanup temporary files
    const cleanupPromises = [
      unlink(inputFile).catch(() => {}),
      unlink(outputFile).catch(() => {}),
    ];

    // Clean up downloaded images (reconstruct full paths)
    for (const filename of imageMap.values()) {
      const fullPath = join(tempDir, filename);
      cleanupPromises.push(unlink(fullPath).catch(() => {}));
    }

    await Promise.all(cleanupPromises);

    return pdfBuffer;
  } catch (error) {
    // Cleanup on error
    const cleanupPromises = [
      unlink(inputFile).catch(() => {}),
      unlink(outputFile).catch(() => {}),
    ];

    // Clean up downloaded images (reconstruct full paths)
    for (const filename of imageMap.values()) {
      const fullPath = join(tempDir, filename);
      cleanupPromises.push(unlink(fullPath).catch(() => {}));
    }

    await Promise.all(cleanupPromises);
    throw error;
  }
}

function sortFlowsHierarchically(flows: any[]): any[] {
  const sorted: any[] = [];
  const processedIds = new Set<string>();

  // Helper function to add a flow and its children
  function addFlowAndChildren(flowId: string) {
    if (processedIds.has(flowId)) return;
    
    const flow = flows.find(f => f.id === flowId);
    if (!flow) return;

    processedIds.add(flowId);
    sorted.push(flow);

    // Find and add child flows (flows that have this flow as parent)
    const childFlows = flows
      .filter(f => f.parent_flow_id === flowId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    for (const childFlow of childFlows) {
      addFlowAndChildren(childFlow.id);
    }
  }

  // First, add all top-level flows (no parent_flow_id) in order
  const topLevelFlows = flows
    .filter(f => !f.parent_flow_id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  for (const flow of topLevelFlows) {
    addFlowAndChildren(flow.id);
  }

  return sorted;
}

function generateTypstDocument(
  project: any,
  flows: any[],
  screensByFlow: Record<string, any[]>,
  imageMap: Map<string, string>
): string {
  const projectName = project.name;
  const timestamp = new Date().toLocaleDateString();

  let typst = `// ${projectName} - User Flow Documentation
// Generated on ${timestamp}

#set page(
  paper: "us-letter",
  flipped: true, // Landscape orientation
  margin: (x: 0.5in, y: 0.5in),
  header: align(right)[
    #text(size: 8pt, fill: gray)[${escapeTypst(projectName)} | User Flow Documentation]
  ],
  footer: context align(center)[
    #text(size: 8pt, fill: gray)[
      Page #counter(page).display("1 / 1", both: true)
    ]
  ],
)

#set text(font: "Arial", size: 10pt)
#set heading(numbering: "1.")

// Title Page
#align(center + horizon)[
  #text(size: 28pt, weight: "bold")[${escapeTypst(projectName)}]
  
  #v(1em)
  #text(size: 14pt, fill: rgb("#555555"))[User Flow Documentation]
  
  #v(2em)
  #line(length: 50%, stroke: 0.5pt + gray)
  
  #v(1em)
  #text(size: 10pt, fill: gray)[Generated on ${timestamp}]
  
  #v(1em)
  #text(size: 9pt, fill: gray)[
    ${flows.length} Flow${flows.length !== 1 ? "s" : ""} • 
    ${Object.values(screensByFlow).flat().length} Screen${Object.values(screensByFlow).flat().length !== 1 ? "s" : ""}
  ]
]

#pagebreak()

// Table of Contents
#heading(level: 1, numbering: none)[Table of Contents]
#v(1em)

`;

  // Sort flows: parent flows first, then their subflows
  const sortedFlows = sortFlowsHierarchically(flows);

  // Add TOC entries
  sortedFlows.forEach((flow, index) => {
    const flowScreens = screensByFlow[flow.id] || [];
    if (flowScreens.length > 0) {
      // Determine flow title for TOC
      let tocTitle = flow.name;
      if (flow.parent_flow_id) {
        const parentFlow = flows.find(f => f.id === flow.parent_flow_id);
        if (parentFlow) {
          tocTitle = `${flow.name} from ${parentFlow.name}`;
        }
      }
      typst += `${index + 1}. ${escapeTypst(tocTitle)} (${flowScreens.length} screen${flowScreens.length !== 1 ? "s" : ""})\n\n`;
    }
  });

  typst += `\n#pagebreak()\n\n`;

  // Generate content for each flow
  for (const flow of sortedFlows) {
    const flowScreens = screensByFlow[flow.id] || [];
    
    if (flowScreens.length === 0) continue;

    // Determine flow title based on hierarchy
    let flowTitleFormatted = "";
    if (flow.parent_flow_id) {
      const parentFlow = flows.find(f => f.id === flow.parent_flow_id);
      if (parentFlow) {
        flowTitleFormatted = `#heading(level: 1, numbering: none)[*${escapeTypst(flow.name)}* from *${escapeTypst(parentFlow.name)}*]`;
      } else {
        flowTitleFormatted = `#heading(level: 1)[${escapeTypst(flow.name)}]`;
      }
    } else if (flow.parent_screen_id) {
      const parentScreen = Object.values(screensByFlow)
        .flat()
        .find((s: any) => s.id === flow.parent_screen_id);
      if (parentScreen) {
        flowTitleFormatted = `#heading(level: 1, numbering: none)[*${escapeTypst(flow.name)}* from *${escapeTypst(parentScreen.title)}*]`;
      } else {
        flowTitleFormatted = `#heading(level: 1)[${escapeTypst(flow.name)}]`;
      }
    } else {
      flowTitleFormatted = `#heading(level: 1)[${escapeTypst(flow.name)}]`;
    }

    typst += `
// Flow: ${escapeTypst(flow.name)}
${flowTitleFormatted}
#line(length: 100%, stroke: 0.5pt + gray.lighten(70%))

${flow.description ? `#v(0.5em)\n#text(size: 9pt, fill: rgb("#666666"), style: "italic")[${escapeTypst(flow.description)}]\n\n` : ""}#v(0.8em)

`;

    // Display all screens in a single horizontal row
    if (flowScreens.length > 0) {
      typst += generateScreenRow(flowScreens, flowScreens.length, imageMap);
    }

    typst += `\n#pagebreak()\n\n`;
  }

  return typst;
}

function generateScreenRow(
  screens: any[],
  totalColumns: number,
  imageMap: Map<string, string>
): string {
  let row = `#grid(
  columns: (${screens.map(() => `1fr`).join(", ")}),
  gutter: 0.5em,\n`;

  for (const screen of screens) {
    const imageUrl = screen.screenshot_url || "";
    const title = screen.title || "Untitled";
    const description = screen.description || "";
    
    // Get local path for the image
    const localImagePath = imageUrl ? imageMap.get(imageUrl) : null;

    row += `  [
    #block(
      width: 100%,
      inset: 0pt,
      breakable: false
    )[
      // Screenshot with rounded corners and shadow
      #box(
        width: 100%,
        radius: 12pt,
        stroke: 0.5pt + rgb("#e5e7eb")
      )[
        ${
          localImagePath
            ? `#image("${localImagePath}", width: 100%, height: 300pt, fit: "contain")`
            : `#box(
          width: 100%, 
          height: 300pt, 
          fill: rgb("#f5f5f5"),
          radius: 12pt
        )[
          #align(center + horizon)[
            #text(size: 9pt, fill: rgb("#999999"))[No Screenshot]
          ]
        ]`
        }
      ]
      
      // Title and description
      #v(0.4em)
      #text(size: 9pt, weight: "bold")[${escapeTypst(title)}]
      ${
        description
          ? `\n      #v(0.15em)\n      #text(size: 7.5pt, fill: rgb("#6b7280"))[${escapeTypst(description)}]`
          : ""
      }
    ]
  ],\n`;
  }

  row += `)\n`;
  return row;
}

function escapeTypst(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\#/g, "\\#")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"');
}
