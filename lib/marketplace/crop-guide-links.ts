export type CropGuideLink = { title: string; href: string; description: string };
const GUIDE_LINKS_BY_PRODUCT_SLUG: Record<string, CropGuideLink[]> = {
  "black-rice-seeds": [{ title: "কালো ধানের বীজের দাম ও কেনার গাইড", href: "/blog/black-rice-seed-price-in-bangladesh", description: "প্যাকেট, দাম ও কেনার আগে যাচাইয়ের বিষয়গুলো পড়ুন।" }],
  "shapla-tomato-seeds": [
    { title: "বাংলাদেশে টমেটো চাষের গাইড", href: "/blog/tomato-cultivation-guide-bangladesh", description: "বীজ থেকে চারা ও চাষ ব্যবস্থাপনার ধাপগুলো জানুন।" },
    { title: "টমেটো পাতার কোকড়ানো: কারণ ও করণীয়", href: "/blog/tomato-leaf-curl-causes-solutions", description: "পাতার লক্ষণ দেখে সম্ভাব্য কারণ ও পরবর্তী পদক্ষেপ বুঝুন।" },
  ],
  "ratan-round-tomato-seeds": [
    { title: "বাংলাদেশে টমেটো চাষের গাইড", href: "/blog/tomato-cultivation-guide-bangladesh", description: "বীজ থেকে চারা ও চাষ ব্যবস্থাপনার ধাপগুলো জানুন।" },
    { title: "টমেটো পাতার কোকড়ানো: কারণ ও করণীয়", href: "/blog/tomato-leaf-curl-causes-solutions", description: "পাতার লক্ষণ দেখে সম্ভাব্য কারণ ও পরবর্তী পদক্ষেপ বুঝুন।" },
  ],
  "baromashi-cucumber-seeds": [{ title: "শসা গাছে ফুল আসে কিন্তু ফল হচ্ছে না", href: "/blog/cucumber-flowers-no-fruit-causes", description: "ফুল ও ফল গঠনে সমস্যা হলে সম্ভাব্য কারণগুলো পড়ুন।" }],
  "f1-hybrid-arabian-cucumber-seeds": [{ title: "শসা গাছে ফুল আসে কিন্তু ফল হচ্ছে না", href: "/blog/cucumber-flowers-no-fruit-causes", description: "ফুল ও ফল গঠনে সমস্যা হলে সম্ভাব্য কারণগুলো পড়ুন।" }],
};
export function getCropGuideLinks(productSlug: string): CropGuideLink[] { return GUIDE_LINKS_BY_PRODUCT_SLUG[productSlug] ?? []; }
