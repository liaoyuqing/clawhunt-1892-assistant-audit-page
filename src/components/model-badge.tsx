export interface ModelBadgeProps {
  model: string;
  promptVersion: string;
}

/** 每条消息底部的模型名与提示词版本徽标。 */
export function ModelBadge({ model, promptVersion }: ModelBadgeProps) {
  return (
    <span className="model-badge" data-testid="model-badge">
      <span className="model-badge__item" title="模型名">
        模型 {model}
      </span>
      <span className="model-badge__dot" aria-hidden="true">
        ·
      </span>
      <span className="model-badge__item" title="提示词版本">
        提示词 {promptVersion}
      </span>
    </span>
  );
}
