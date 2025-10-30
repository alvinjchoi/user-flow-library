"use client";

import { UiComponentAnnotator } from "@/components/vision/ui-component-annotator";

export default function UiDetectorPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Vision 기반 UI 컴포넌트 감지 데모
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          스크린샷을 업로드하면 OpenAI Vision 모델이 주요 UI 컴포넌트를 찾아
          픽셀 좌표를 반환하고, 아래에서 실시간으로 박스를 그려 줍니다. 좌표는
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">
            top / left / width / height
          </code>
          형태로 제공되며, 프런트엔드에서 그대로 오버레이를 만들 수 있습니다.
        </p>
      </header>

      <UiComponentAnnotator />

      <section className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          사용 방법
        </h2>
        <ol className="space-y-1 list-decimal list-inside">
          <li>
            환경 변수 <code className="mx-1 rounded bg-muted px-1 py-0.5">
              OPENAI_API_KEY
            </code>{" "}
            를 설정합니다.
          </li>
          <li>모바일 혹은 웹 스크린샷 파일을 업로드합니다.</li>
          <li>
            “AI로 분석”을 누르면 최대 지정 개수만큼의 컴포넌트가 감지되어
            좌표와 함께 표시됩니다.
          </li>
          <li>
            우측 목록의 좌표 데이터를 이용해 원하는 형태로 오버레이하거나,
            JSON을 저장하여 다른 툴과 연동할 수 있습니다.
          </li>
        </ol>
      </section>
    </div>
  );
}
