import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export default function BrandLogo({
  href = "/",
  className = "",
  imageClassName = "h-10 w-40",
  priority = false,
}: BrandLogoProps) {
  return (
    <Link href={href} aria-label="AGRIVA home" className={`inline-flex items-center ${className}`}>
      <Image
        src="/agriva-logo.svg"
        alt="AGRIVA — Growing a Better Tomorrow"
        width={320}
        height={85}
        priority={priority}
        sizes="(max-width: 640px) 160px, 208px"
        className={`object-contain object-left ${imageClassName}`}
      />
    </Link>
  );
}
