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
        src="/branding/agriva-agriculture-brand-logo.webp"
        alt="AGRIVA (এগ্রিভা) — কৃষিপণ্য, বীজ ও স্মার্ট কৃষিসেবার ডিজিটাল প্ল্যাটফর্ম"
        width={640}
        height={158}
        priority={priority}
        sizes="(max-width: 640px) 160px, 208px"
        className={`object-contain object-left ${imageClassName}`}
      />
    </Link>
  );
}
