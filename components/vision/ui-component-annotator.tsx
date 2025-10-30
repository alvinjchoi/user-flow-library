"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BoundingBox = {
  id: string;
  label: string;
  description?: string;
  confidence?: number;
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

type DetectionResponse = {
  components: BoundingBox[];
};

export function UiComponentAnnotator() {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [renderSize, setRenderSize] = useState<{ width: number; height: number }>(
    { width: 0, height: 0 }
  );
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxComponents, setMaxComponents] = useState(10);

  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!imageDataUrl || !imgRef.current) return;

    const updateSize = () => {
      if (!imgRef.current) return;
      setRenderSize({
        width: imgRef.current.clientWidth,
        height: imgRef.current.clientHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [imageDataUrl]);

  const scale = useMemo(() => {
    if (!imageNaturalSize || renderSize.width === 0 || renderSize.height === 0) {
      return { x: 1, y: 1 };
    }

    return {
      x: renderSize.width / imageNaturalSize.width,
      y: renderSize.height / imageNaturalSize.height,
    };
  }, [imageNaturalSize, renderSize]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    try {
      setError(null);
      setBoxes([]);

      const reader = new FileReader();
      reader.onload = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("이미지를 불러오는 중 문제가 발생했습니다.");
    }
  };

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      setError("먼저 이미지를 업로드하세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setBoxes([]);

    try {
      const response = await fetch("/api/ui-component-detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          maxComponents,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "AI 분석 요청이 실패했습니다.");
      }

      const data = (await response.json()) as DetectionResponse;
      setBoxes(data.components || []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "AI 분석 중 알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageDataUrl(null);
    setBoxes([]);
    setError(null);
    setImageNaturalSize(null);
    setRenderSize({ width: 0, height: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1">
            <span className="mb-1 block text-sm font-medium text-muted-foreground">
              스크린샷 업로드
            </span>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              최대 감지 수
            </span>
            <Input
              type="number"
              min={1}
              max={25}
              value={maxComponents}
              onChange={(e) => setMaxComponents(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAnalyze} disabled={loading || !imageDataUrl}>
              {loading ? "분석 중..." : "AI로 분석"}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!imageDataUrl && boxes.length === 0}>
              초기화
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/60 bg-muted/40 p-4",
            imageDataUrl ? "min-h-[320px]" : "min-h-[240px]"
          )}
        >
          {!imageDataUrl ? (
            <p className="text-sm text-muted-foreground">
              분석하려는 스크린샷을 업로드하세요.
            </p>
          ) : (
            <div className="relative w-full max-w-[480px]">
              <img
                ref={imgRef}
                src={imageDataUrl}
                alt="Uploaded screenshot"
                className="w-full rounded-md border border-border"
                onLoad={(event) => {
                  const target = event.currentTarget;
                  setImageNaturalSize({
                    width: target.naturalWidth,
                    height: target.naturalHeight,
                  });
                  setRenderSize({
                    width: target.clientWidth,
                    height: target.clientHeight,
                  });
                }}
              />

              {boxes.map((box) => {
                const top = box.bounds.top * scale.y;
                const left = box.bounds.left * scale.x;
                const width = box.bounds.width * scale.x;
                const height = box.bounds.height * scale.y;

                return (
                  <div
                    key={box.id}
                    className="absolute rounded-md border border-blue-500 bg-blue-500/10 shadow-sm backdrop-blur-[1px]"
                    style={{
                      top,
                      left,
                      width,
                      height,
                    }}
                  >
                    <span className="absolute -top-6 left-0 rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow">
                      {box.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            감지된 컴포넌트
          </h3>
          {boxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 감지된 컴포넌트가 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {boxes.map((box) => (
                <li
                  key={box.id}
                  className="rounded-md border border-border bg-background p-3 text-sm shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {box.label}
                    </span>
                    {typeof box.confidence === "number" && (
                      <span className="text-xs text-muted-foreground">
                        {(box.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {box.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {box.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    좌표: top {box.bounds.top}, left {box.bounds.left}, width{" "}
                    {box.bounds.width}, height {box.bounds.height}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
