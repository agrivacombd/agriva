import type { Metadata } from "next";
import TransportBooking from "@/components/transport/TransportBooking";

export const metadata: Metadata = {
  title: "কৃষিপণ্য পরিবহন বুকিং",
  description: "কৃষিপণ্য পরিবহনের অনুরোধ দিন, যাচাইকৃত পরিবহন পার্টনারদের ভাড়ার অফার তুলনা করুন এবং বুকিংয়ের অবস্থা দেখুন।",
  alternates: { canonical: "/transport" },
};

export default function TransportPage() {
  return <TransportBooking />;
}
