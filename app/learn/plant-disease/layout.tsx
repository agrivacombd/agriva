import type {Metadata} from "next";
export const metadata:Metadata={
  title:"ফসলের রোগ শনাক্তকরণ শিক্ষা | ধান, গম, সবজি ও ফলের রোগ",
  description:"বাংলাদেশে ধান, গম, টমেটো, আলু, বেগুনসহ ফসলের রোগের লক্ষণ, সম্ভাব্য কারণ, প্রতিরোধ ও সমন্বিত ব্যবস্থাপনা (IPM) শেখার গাইড। শুধু লক্ষণ দেখে রোগ নিশ্চিত নয়।",
  alternates:{canonical:"/learn/plant-disease"},
  openGraph:{title:"Plant Disease Learning Lab | AGRIVA",description:"বাংলাদেশের ফসলের রোগের লক্ষণ, সম্ভাব্য কারণ, IPM এবং নিরাপদ কৃষি পরামর্শের শেখার কেন্দ্র।",url:"/learn/plant-disease",type:"website",locale:"bn_BD"},
  keywords:["ফসলের রোগ","ধানের রোগ","টমেটোর রোগ","আলুর মড়ক","plant disease Bangladesh","IPM","রোগের লক্ষণ"],
};
export default function PlantDiseaseLayout({children}:{children:React.ReactNode}){return children;}
