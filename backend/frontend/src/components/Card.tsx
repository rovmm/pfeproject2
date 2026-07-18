import type { HTMLAttributes } from 'react';

export default function Card({
  padded = true,
  hover = false,
  className = '',
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean; hover?: boolean }) {
  return (
    <div
      className={`card ${padded ? 'card-pad' : ''} ${hover ? 'card-hover' : ''} ${className}`}
      style={style}
      {...rest}
    />
  );
}
