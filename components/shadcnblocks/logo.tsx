import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

interface LogoProps {
  url?: string;
  children: ReactNode;
  className?: string;
}

export function Logo({ url = "/", children, className }: LogoProps) {
  if (url) {
    return (
      <Link href={url} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

interface LogoImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
}

export function LogoImage({ src, alt, title, className }: LogoImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={40}
      height={40}
      className={className}
    />
  );
}

interface LogoTextProps {
  children: ReactNode;
  className?: string;
}

export function LogoText({ children, className }: LogoTextProps) {
  return <span className={className}>{children}</span>;
}

