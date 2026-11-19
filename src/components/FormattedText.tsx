import React from 'react';
import {
  FormattedBlock,
  parseInlineSegments,
  parseReadableBlocks,
} from '../utils/textFormatUtils';

export type FormattedTextAccent = 'indigo' | 'coral' | 'amber' | 'teal' | 'violet';

interface FormattedTextProps {
  text?: string | null;
  accent?: FormattedTextAccent;
  size?: 'sm' | 'base';
  className?: string;
}

const ACCENT_STYLES: Record<
  FormattedTextAccent,
  { bullet: string; number: string }
> = {
  indigo: {
    bullet: 'bg-[#4338CA]',
    number: 'text-[#4338CA]',
  },
  coral: {
    bullet: 'bg-[#E11D48]',
    number: 'text-[#BE123C]',
  },
  amber: {
    bullet: 'bg-[#D97706]',
    number: 'text-[#B45309]',
  },
  teal: {
    bullet: 'bg-[#0D9488]',
    number: 'text-[#0F766E]',
  },
  violet: {
    bullet: 'bg-[#7C3AED]',
    number: 'text-[#6D28D9]',
  },
};

function renderInline(text: string): React.ReactNode {
  const segments = parseInlineSegments(text);
  if (segments.length === 1 && segments[0].type === 'text') {
    return segments[0].value;
  }

  return segments.map((segment, index) => {
    if (segment.type === 'bold') {
      return (
        <strong key={index} className="font-semibold text-[#0F172A]">
          {segment.value}
        </strong>
      );
    }
    if (segment.type === 'italic') {
      return (
        <em key={index} className="italic">
          {segment.value}
        </em>
      );
    }
    return <React.Fragment key={index}>{segment.value}</React.Fragment>;
  });
}

type RenderGroup =
  | { kind: 'single'; block: FormattedBlock }
  | {
      kind: 'titled-list';
      heading: Extract<FormattedBlock, { type: 'heading' }>;
      list: Extract<FormattedBlock, { type: 'bullet-list' | 'numbered-list' }>;
    };

function groupBlocksForReading(blocks: FormattedBlock[]): RenderGroup[] {
  const groups: RenderGroup[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const current = blocks[i];
    const next = blocks[i + 1];

    if (
      current.type === 'heading' &&
      next &&
      (next.type === 'bullet-list' || next.type === 'numbered-list')
    ) {
      groups.push({ kind: 'titled-list', heading: current, list: next });
      i++;
      continue;
    }

    groups.push({ kind: 'single', block: current });
  }

  return groups;
}

/**
 * Componente reutilizable para mostrar textos informativos de forma clara,
 * limpia y legible en móvil y escritorio sin HTML inseguro.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  accent = 'indigo',
  size = 'base',
  className = '',
}) => {
  const blocks = parseReadableBlocks(text);
  if (blocks.length === 0) return null;

  const groups = groupBlocksForReading(blocks);
  const accentStyle = ACCENT_STYLES[accent];
  const bodySizeClass =
    size === 'sm'
      ? 'text-[13px] leading-relaxed'
      : 'text-[14px] leading-[1.65]';
  const listItemSizeClass =
    size === 'sm'
      ? 'text-[13px] leading-relaxed'
      : 'text-[13.5px] sm:text-[14px] leading-[1.6]';
  const headingSizeClass =
    size === 'sm'
      ? 'text-[13px] leading-snug'
      : 'text-[13.5px] sm:text-[14px] leading-snug';
  const bulletOffsetClass = size === 'sm' ? 'mt-[0.44rem]' : 'mt-[0.48rem]';

  const renderListBlock = (
    block: Extract<FormattedBlock, { type: 'bullet-list' | 'numbered-list' }>
  ) => {
    if (block.type === 'bullet-list') {
      return (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {block.items.map((item, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2.5 text-[#334155] ${listItemSizeClass}`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${bulletOffsetClass} ${accentStyle.bullet}`}
              />
              <span className="min-w-0 flex-1 break-words">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <ol className="flex flex-col gap-2 list-none p-0 m-0">
        {block.items.map((item, idx) => (
          <li
            key={idx}
            className={`flex items-start gap-2 text-[#334155] ${listItemSizeClass}`}
          >
            <span
              className={`font-bold tabular-nums shrink-0 min-w-[1.25rem] ${accentStyle.number}`}
            >
              {item.marker}
            </span>
            <span className="min-w-0 flex-1 break-words">{renderInline(item.text)}</span>
          </li>
        ))}
      </ol>
    );
  };

  return (
    <div className={`space-y-2.5 text-[#334155] min-w-0 ${className}`.trim()}>
      {groups.map((group, idx) => {
        if (group.kind === 'titled-list') {
          return (
            <div key={idx} className="space-y-2 pt-0.5 first:pt-0">
              <h4
                className={`font-display font-bold text-[#0F172A] tracking-tight break-words ${headingSizeClass}`}
              >
                {renderInline(group.heading.text)}
              </h4>
              {renderListBlock(group.list)}
            </div>
          );
        }

        const { block } = group;

        if (block.type === 'heading') {
          return (
            <h4
              key={idx}
              className={`font-display font-bold text-[#0F172A] tracking-tight pt-1 first:pt-0 break-words ${headingSizeClass}`}
            >
              {renderInline(block.text)}
            </h4>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p key={idx} className={`text-[#334155] break-words ${bodySizeClass}`}>
              {renderInline(block.text)}
            </p>
          );
        }

        return <div key={idx}>{renderListBlock(block)}</div>;
      })}
    </div>
  );
};
