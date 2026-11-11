"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Plant = { bn: string; en: string; scientific: string; family: string; group: string; clue: string };
const plants: Plant[] = [
  {bn:"আম",en:"Mango",scientific:"Mangifera indica",family:"Anacardiaceae",group:"Fruit tree",clue:"চিরসবুজ ফলের গাছ; পাকা ফল সুগন্ধি।"},
  {bn:"কাঁঠাল",en:"Jackfruit",scientific:"Artocarpus heterophyllus",family:"Moraceae",group:"Fruit tree",clue:"বাংলাদেশের জাতীয় ফল; বড় যৌগিক ফল।"},
  {bn:"নিম",en:"Neem",scientific:"Azadirachta indica",family:"Meliaceae",group:"Medicinal tree",clue:"পাতা সাধারণত করাতের দাঁতের মতো খাঁজযুক্ত।"},
  {bn:"নারিকেল",en:"Coconut",scientific:"Cocos nucifera",family:"Arecaceae",group:"Palm",clue:"একক কাণ্ডের পাম; আঁশযুক্ত ফল।"},
  {bn:"পেয়ারা",en:"Guava",scientific:"Psidium guajava",family:"Myrtaceae",group:"Fruit tree",clue:"পাতায় স্পষ্ট শিরা; ফলের ভেতরে অনেক বীজ।"},
  {bn:"সজিনা",en:"Drumstick tree",scientific:"Moringa oleifera",family:"Moringaceae",group:"Food tree",clue:"খাদ্যযোগ্য লম্বা শুঁটি ও যৌগিক পাতা।"},
  {bn:"তেঁতুল",en:"Tamarind",scientific:"Tamarindus indica",family:"Fabaceae",group:"Fruit tree",clue:"টক শাঁসযুক্ত ফল; ছোট ছোট পত্রক থাকে।"},
  {bn:"বট",en:"Banyan",scientific:"Ficus benghalensis",family:"Moraceae",group:"Shade tree",clue:"ডাল থেকে ঝুলে নামা বায়বীয় শিকড় দেখা যায়।"},
  {bn:"পলাশ",en:"Flame of the forest",scientific:"Butea monosperma",family:"Fabaceae",group:"Flowering tree",clue:"কমলা-লাল ফুলের জন্য পরিচিত।"},
  {bn:"শিসু",en:"Indian rosewood",scientific:"Dalbergia sissoo",family:"Fabaceae",group:"Timber tree",clue:"মূল্যবান কাঠের গাছ; যৌগিক পাতা।"},
  {bn:"শাল",en:"Sal",scientific:"Shorea robusta",family:"Dipterocarpaceae",group:"Forest tree",clue:"দক্ষিণ এশিয়ার গুরুত্বপূর্ণ বনজ কাঠ।"},
  {bn:"সেগুন",en:"Teak",scientific:"Tectona grandis",family:"Lamiaceae",group:"Timber tree",clue:"বড় ও রুক্ষ পাতা; মূল্যবান কাঠ।"},
  {bn:"জাম",en:"Java plum",scientific:"Syzygium cumini",family:"Myrtaceae",group:"Fruit tree",clue:"গাঢ় বেগুনি ফল; চিরসবুজ গাছ।"},
  {bn:"লিচু",en:"Lychee",scientific:"Litchi chinensis",family:"Sapindaceae",group:"Fruit tree",clue:"খসখসে লাল খোসার মিষ্টি ফল।"},
  {bn:"কদম",en:"Burflower tree",scientific:"Neolamarckia cadamba",family:"Rubiaceae",group:"Flowering tree",clue:"গোলাকার কমলা-হলুদ ফুলের মঞ্জরি।"},
  {bn:"শিমুল",en:"Red silk-cotton tree",scientific:"Bombax ceiba",family:"Malvaceae",group:"Flowering tree",clue:"বসন্তে লাল ফুল; ফলের ভেতর তুলার মতো আঁশ।"},
  {bn:"কৃষ্ণচূড়া",en:"Royal poinciana",scientific:"Delonix regia",family:"Fabaceae",group:"Flowering tree",clue:"ছাতার মতো মুকুট ও উজ্জ্বল লাল-কমলা ফুল।"},
  {bn:"অর্জুন",en:"Arjun tree",scientific:"Terminalia arjuna",family:"Combretaceae",group:"Medicinal tree",clue:"কাণ্ডের ছাল ধূসর; নদীতীরেও দেখা যায়।"},
  {bn:"বকুল",en:"Spanish cherry",scientific:"Mimusops elengi",family:"Sapotaceae",group:"Shade tree",clue:"ছোট সুগন্ধি ফুল; ঘন পাতার মুকুট।"},
  {bn:"তাল",en:"Palmyra palm",scientific:"Borassus flabellifer",family:"Arecaceae",group:"Palm",clue:"পাখার মতো বড় পাতা ও শক্ত ফল।"},
  {bn:"সুপারি",en:"Areca nut palm",scientific:"Areca catechu",family:"Arecaceae",group:"Palm",clue:"সরু কাণ্ডের পাম; ফল সুপারি হিসেবে পরিচিত।"},
  {bn:"রাধাচূড়া",en:"Peacock flower",scientific:"Caesalpinia pulcherrima",family:"Fabaceae",group:"Flowering tree",clue:"ছোট শোভাবর্ধক গাছ; লাল-কমলা ফুল ও লম্বা পুংকেশর।"},
  {bn:"বেল",en:"Bael",scientific:"Aegle marmelos",family:"Rutaceae",group:"Fruit tree",clue:"কঠিন খোসার ফল; পাতা সাধারণত তিনটি পত্রকবিশিষ্ট।"},
  {bn:"জলপাই",en:"Indian olive",scientific:"Elaeocarpus serratus",family:"Elaeocarpaceae",group:"Fruit tree",clue:"টক ফল; বাংলাদেশের পরিচিত জলপাইয়ের একটি প্রচলিত নাম।"},
  {bn:"ধান",en:"Rice",scientific:"Oryza sativa",family:"Poaceae",group:"Cereal crop",clue:"বাংলাদেশের প্রধান খাদ্যশস্য; আউশ, আমন ও বোরো মৌসুমে চাষ হয়।"},
  {bn:"গম",en:"Wheat",scientific:"Triticum aestivum",family:"Poaceae",group:"Cereal crop",clue:"শীতকালীন দানাশস্য; দানা থেকে আটা তৈরি হয়।"},
  {bn:"ভুট্টা",en:"Maize",scientific:"Zea mays",family:"Poaceae",group:"Cereal crop",clue:"মোচায় সারিবদ্ধ দানা থাকে; খাদ্য ও পশুখাদ্য হিসেবে ব্যবহৃত।"},
  {bn:"যব",en:"Barley",scientific:"Hordeum vulgare",family:"Poaceae",group:"Cereal crop",clue:"শীতকালীন দানাশস্য; শীষে লম্বা awn থাকতে পারে।"},
  {bn:"জোয়ার",en:"Sorghum",scientific:"Sorghum bicolor",family:"Poaceae",group:"Cereal crop",clue:"তুলনামূলক খরা-সহনশীল দানাশস্য; পুষ্পমঞ্জরি শীর্ষে হয়।"},
  {bn:"কাউন",en:"Foxtail millet",scientific:"Setaria italica",family:"Poaceae",group:"Cereal crop",clue:"ছোট দানার শস্য; শীষ ঘন ও লোমশ দেখায়।"},
  {bn:"চীনা",en:"Proso millet",scientific:"Panicum miliaceum",family:"Poaceae",group:"Cereal crop",clue:"স্বল্পমেয়াদি ছোট দানার শস্য; তুলনামূলক কম পানিতে জন্মাতে পারে।"},
  {bn:"আখ",en:"Sugarcane",scientific:"Saccharum officinarum",family:"Poaceae",group:"Cash crop",clue:"গাঁটযুক্ত রসালো কাণ্ডে চিনি সঞ্চিত থাকে।"},
  {bn:"পাট",en:"White jute",scientific:"Corchorus capsularis",family:"Malvaceae",group:"Fibre crop",clue:"বাকল থেকে আঁশ পাওয়া যায়; পাতা সরল ও করাত-দাঁত প্রান্তযুক্ত।"},
  {bn:"তোষা পাট",en:"Tossa jute",scientific:"Corchorus olitorius",family:"Malvaceae",group:"Fibre crop",clue:"বাংলাদেশের গুরুত্বপূর্ণ আঁশ ফসল; কচি পাতা শাক হিসেবেও খাওয়া হয়।"},
  {bn:"মসুর",en:"Lentil",scientific:"Lens culinaris",family:"Fabaceae",group:"Pulse crop",clue:"শীতকালীন ডাল; ফল চ্যাপ্টা শুঁটি এবং বীজ লেন্সের মতো।"},
  {bn:"ছোলা",en:"Chickpea",scientific:"Cicer arietinum",family:"Fabaceae",group:"Pulse crop",clue:"পাতা যৌগিক ও ছোট পত্রকযুক্ত; শুঁটিতে সাধারণত এক-দুইটি বীজ।"},
  {bn:"মুগ",en:"Mung bean",scientific:"Vigna radiata",family:"Fabaceae",group:"Pulse crop",clue:"ছোট সবুজ বীজের ডাল; শুঁটি সরু ও লম্বাটে।"},
  {bn:"মাষকলাই",en:"Black gram",scientific:"Vigna mungo",family:"Fabaceae",group:"Pulse crop",clue:"কালো বীজের ডাল; শুঁটি পরিপক্ব হলে গাঢ় হয়।"},
  {bn:"খেসারি",en:"Grass pea",scientific:"Lathyrus sativus",family:"Fabaceae",group:"Pulse crop",clue:"শীতকালীন ডাল; নীলচে ফুল ও চ্যাপ্টা শুঁটি দেখা যায়।"},
  {bn:"মটর",en:"Garden pea",scientific:"Pisum sativum",family:"Fabaceae",group:"Pulse crop",clue:"লতানো বা আধা-লতানো গাছ; পাতার অগ্রভাগে আকর্ষী থাকে।"},
  {bn:"অড়হর",en:"Pigeon pea",scientific:"Cajanus cajan",family:"Fabaceae",group:"Pulse crop",clue:"বহুবর্ষজীবী স্বভাবের ঝোপ; শুঁটিতে কয়েকটি বীজ থাকে।"},
  {bn:"বরবটি",en:"Yardlong bean",scientific:"Vigna unguiculata",family:"Fabaceae",group:"Vegetable",clue:"লম্বা সরু শুঁটি; গাছ লতানো এবং ফল সবজি হিসেবে খাওয়া হয়।"},
  {bn:"সয়াবিন",en:"Soybean",scientific:"Glycine max",family:"Fabaceae",group:"Oilseed crop",clue:"তিন পত্রকবিশিষ্ট পাতা; শুঁটিতে সাধারণত একাধিক বীজ থাকে।"},
  {bn:"চিনাবাদাম",en:"Groundnut",scientific:"Arachis hypogaea",family:"Fabaceae",group:"Oilseed crop",clue:"নিষেকের পর gynophore মাটিতে ঢুকে মাটির নিচে শুঁটি তৈরি করে।"},
  {bn:"তিল",en:"Sesame",scientific:"Sesamum indicum",family:"Pedaliaceae",group:"Oilseed crop",clue:"লম্বাটে ফল ক্যাপসুল; বীজ থেকে ভোজ্য তেল পাওয়া যায়।"},
  {bn:"সরিষা",en:"Indian mustard",scientific:"Brassica juncea",family:"Brassicaceae",group:"Oilseed crop",clue:"হলুদ চার পাপড়ির ফুল; ফল সরু siliqua ধরনের।"},
  {bn:"রাই সরিষা",en:"Rapeseed",scientific:"Brassica napus",family:"Brassicaceae",group:"Oilseed crop",clue:"শীতকালীন তেলবীজ; হলুদ ফুল ও সরু ফল হয়।"},
  {bn:"সূর্যমুখী",en:"Sunflower",scientific:"Helianthus annuus",family:"Asteraceae",group:"Oilseed crop",clue:"বড় capitulum-এ অসংখ্য ক্ষুদ্র ফুল থাকে; বীজ থেকে তেল হয়।"},
  {bn:"তিসি",en:"Flax",scientific:"Linum usitatissimum",family:"Linaceae",group:"Oilseed crop",clue:"নীল ফুল ও গোলাকার ক্যাপসুল; বীজে তেল থাকে।"},
  {bn:"আলু",en:"Potato",scientific:"Solanum tuberosum",family:"Solanaceae",group:"Tuber crop",clue:"মাটির নিচের কাণ্ডের স্ফীত অংশ কন্দ হিসেবে খাওয়া হয়।"},
  {bn:"মিষ্টি আলু",en:"Sweet potato",scientific:"Ipomoea batatas",family:"Convolvulaceae",group:"Tuber crop",clue:"লতানো গাছ; স্ফীত মূল খাদ্য হিসেবে ব্যবহৃত হয়।"},
  {bn:"কচু",en:"Taro",scientific:"Colocasia esculenta",family:"Araceae",group:"Tuber crop",clue:"বড় হৃদপিণ্ডাকৃতির পাতা; ভূগর্ভস্থ কন্দ খাদ্যযোগ্য।"},
  {bn:"ওল",en:"Elephant foot yam",scientific:"Amorphophallus paeoniifolius",family:"Araceae",group:"Tuber crop",clue:"বড় ভূগর্ভস্থ কন্দ; একক বিশাল বিভক্ত পাতা দেখা যায়।"},
  {bn:"টমেটো",en:"Tomato",scientific:"Solanum lycopersicum",family:"Solanaceae",group:"Vegetable",clue:"হলুদ তারকার মতো ফুল; ফল বেরি এবং বিভিন্ন রঙে পাকে।"},
  {bn:"বেগুন",en:"Eggplant",scientific:"Solanum melongena",family:"Solanaceae",group:"Vegetable",clue:"বেগুনি বা সাদা ফুল; ফলের বৃতি গোড়ায় স্পষ্ট থাকে।"},
  {bn:"মরিচ",en:"Chilli pepper",scientific:"Capsicum annuum",family:"Solanaceae",group:"Vegetable",clue:"ফাঁপা বেরি ফল; ঝাল জাতের ফলে capsaicinoid থাকে।"},
  {bn:"ঢেঁড়স",en:"Okra",scientific:"Abelmoschus esculentus",family:"Malvaceae",group:"Vegetable",clue:"হলুদ ফুলের কেন্দ্রে গাঢ় দাগ; লম্বা শুঁটি কচি অবস্থায় খাওয়া হয়।"},
  {bn:"বাঁধাকপি",en:"Cabbage",scientific:"Brassica oleracea var. capitata",family:"Brassicaceae",group:"Vegetable",clue:"ঘনভাবে জড়ানো পাতার মাথা সবজি হিসেবে ব্যবহৃত হয়।"},
  {bn:"ফুলকপি",en:"Cauliflower",scientific:"Brassica oleracea var. botrytis",family:"Brassicaceae",group:"Vegetable",clue:"অপরিণত সাদা পুষ্পমঞ্জরি বা curd খাওয়া হয়।"},
  {bn:"মূলা",en:"Radish",scientific:"Raphanus sativus",family:"Brassicaceae",group:"Vegetable",clue:"স্ফীত প্রধান মূল খাদ্যযোগ্য; ফুলে চারটি পাপড়ি থাকে।"},
  {bn:"গাজর",en:"Carrot",scientific:"Daucus carota",family:"Apiaceae",group:"Vegetable",clue:"কমলা বা অন্যান্য রঙের স্ফীত মূল; পুষ্পমঞ্জরি ছাতার মতো।"},
  {bn:"পালংশাক",en:"Spinach",scientific:"Spinacia oleracea",family:"Amaranthaceae",group:"Leafy vegetable",clue:"পাতা শাক হিসেবে খাওয়া হয়; শীতল আবহাওয়ায় ভালো জন্মে।"},
  {bn:"লালশাক",en:"Red amaranth",scientific:"Amaranthus tricolor",family:"Amaranthaceae",group:"Leafy vegetable",clue:"পাতায় লাল, সবুজ বা হলুদ রঙের বৈচিত্র্য দেখা যায়।"},
  {bn:"পুঁইশাক",en:"Malabar spinach",scientific:"Basella alba",family:"Basellaceae",group:"Leafy vegetable",clue:"রসালো লতানো কাণ্ড ও পাতা; গরম-আর্দ্র আবহাওয়ায় ভালো হয়।"},
  {bn:"লাউ",en:"Bottle gourd",scientific:"Lagenaria siceraria",family:"Cucurbitaceae",group:"Vegetable",clue:"লতানো গাছ; সাদা ফুল ও বিভিন্ন আকৃতির ফল।"},
  {bn:"মিষ্টিকুমড়া",en:"Pumpkin",scientific:"Cucurbita moschata",family:"Cucurbitaceae",group:"Vegetable",clue:"লতানো গাছ; বড় হলুদ ফুল ও শক্ত খোসার ফল।"},
  {bn:"শসা",en:"Cucumber",scientific:"Cucumis sativus",family:"Cucurbitaceae",group:"Vegetable",clue:"আকর্ষীযুক্ত লতা; কচি সবুজ ফল সালাদে ব্যবহৃত হয়।"},
  {bn:"করলা",en:"Bitter gourd",scientific:"Momordica charantia",family:"Cucurbitaceae",group:"Vegetable",clue:"খাঁজকাটা তিক্ত ফল; পাকা ফলে লাল aril-যুক্ত বীজ দেখা যায়।"},
  {bn:"ঝিঙা",en:"Ridge gourd",scientific:"Luffa acutangula",family:"Cucurbitaceae",group:"Vegetable",clue:"ফলে লম্বালম্বি খাঁজ থাকে; কচি ফল সবজি হিসেবে খাওয়া হয়।"},
  {bn:"ধুন্দল",en:"Sponge gourd",scientific:"Luffa aegyptiaca",family:"Cucurbitaceae",group:"Vegetable",clue:"লম্বা ফল; পরিপক্ব শুকনো ফলের আঁশ দিয়ে প্রাকৃতিক স্পঞ্জ হয়।"},
  {bn:"চালকুমড়া",en:"Ash gourd",scientific:"Benincasa hispida",family:"Cucurbitaceae",group:"Vegetable",clue:"বড় ফলের গায়ে পরিণত অবস্থায় সাদা মোমের মতো আবরণ হয়।"},
  {bn:"পটল",en:"Pointed gourd",scientific:"Trichosanthes dioica",family:"Cucurbitaceae",group:"Vegetable",clue:"বহুবর্ষজীবী লতা; ডিম্বাকার-লম্বাটে ফল সবজি হিসেবে ব্যবহৃত।"},
  {bn:"চিচিঙ্গা",en:"Snake gourd",scientific:"Trichosanthes cucumerina",family:"Cucurbitaceae",group:"Vegetable",clue:"লম্বা সরু ফল; পরিণত ফলে লাল শাঁস দেখা যায়।"},
  {bn:"তরমুজ",en:"Watermelon",scientific:"Citrullus lanatus",family:"Cucurbitaceae",group:"Fruit",clue:"লতানো গাছ; বড় রসালো ফলের ভেতর কালো বা বাদামি বীজ থাকে।"},
  {bn:"কলা",en:"Banana",scientific:"Musa acuminata",family:"Musaceae",group:"Fruit",clue:"বড় কন্দসদৃশ underground stem থেকে পাতা বের হয়; ফল থোকায় ধরে।"},
  {bn:"পেঁপে",en:"Papaya",scientific:"Carica papaya",family:"Caricaceae",group:"Fruit",clue:"কাণ্ডের শীর্ষে বড় খণ্ডিত পাতা; ফল কাণ্ডের গায়ে ধরে।"},
  {bn:"আনারস",en:"Pineapple",scientific:"Ananas comosus",family:"Bromeliaceae",group:"Fruit",clue:"পাতার রোজেটের কেন্দ্রে পুষ্পমঞ্জরি; বহু ফল মিলে যৌগিক ফল তৈরি করে।"},
  {bn:"কুল",en:"Indian jujube",scientific:"Ziziphus mauritiana",family:"Rhamnaceae",group:"Fruit",clue:"কাঁটাযুক্ত ডাল; ছোট গোল বা ডিম্বাকার ফল পাকে।"},
  {bn:"কামরাঙা",en:"Star fruit",scientific:"Averrhoa carambola",family:"Oxalidaceae",group:"Fruit",clue:"আড়াআড়ি কাটলে পাঁচ কোণার তারার মতো আকৃতি হয়।"},
  {bn:"আতা",en:"Sugar apple",scientific:"Annona squamosa",family:"Annonaceae",group:"Fruit",clue:"ফলের খোসায় আলাদা আলাদা আঁশের মতো খণ্ড থাকে।"},
  {bn:"লেবু",en:"Lemon",scientific:"Citrus limon",family:"Rutaceae",group:"Fruit",clue:"সুগন্ধি তেলযুক্ত পাতার গ্রন্থি ও টক রসালো ফল।"},
  {bn:"কমলা",en:"Sweet orange",scientific:"Citrus sinensis",family:"Rutaceae",group:"Fruit",clue:"সুগন্ধি সাদা ফুল; খোসায় তেলগ্রন্থি ও খণ্ডযুক্ত ফল।"},
  {bn:"ডালিম",en:"Pomegranate",scientific:"Punica granatum",family:"Lythraceae",group:"Fruit",clue:"চামড়ার মতো খোসার ভেতর রসালো aril-এ বীজ আবৃত থাকে।"},
  {bn:"ড্রাগন ফল",en:"Dragon fruit",scientific:"Selenicereus undatus",family:"Cactaceae",group:"Fruit",clue:"আরোহী ক্যাকটাস; বড় রাতফোটা ফুল ও আঁশযুক্ত খোসার ফল।"},
  {bn:"পান",en:"Betel leaf",scientific:"Piper betle",family:"Piperaceae",group:"Spice and beverage",clue:"সুগন্ধি হৃদপিণ্ডাকৃতির পাতা; লতানো কাণ্ডে গিঁট থেকে শিকড় বের হয়।"},
  {bn:"গোলমরিচ",en:"Black pepper",scientific:"Piper nigrum",family:"Piperaceae",group:"Spice",clue:"আরোহী লতা; ফলের শুকনো ড্রুপ মসলা হিসেবে ব্যবহৃত।"},
  {bn:"আদা",en:"Ginger",scientific:"Zingiber officinale",family:"Zingiberaceae",group:"Spice",clue:"মাটির নিচে সুগন্ধি rhizome; সরু বর্শাকৃতি পাতা।"},
  {bn:"হলুদ",en:"Turmeric",scientific:"Curcuma longa",family:"Zingiberaceae",group:"Spice",clue:"কমলা-হলুদ রঙের rhizome; রান্নার মসলা হিসেবে ব্যবহৃত।"},
  {bn:"রসুন",en:"Garlic",scientific:"Allium sativum",family:"Amaryllidaceae",group:"Spice",clue:"ভূগর্ভস্থ bulb অনেক কোয়ায় বিভক্ত; তীব্র গন্ধযুক্ত।"},
  {bn:"পেঁয়াজ",en:"Onion",scientific:"Allium cepa",family:"Amaryllidaceae",group:"Spice",clue:"স্তরযুক্ত bulb; পাতার গোড়া মাংসল হয়ে সঞ্চয়ী অঙ্গ তৈরি করে।"},
  {bn:"ধনিয়া",en:"Coriander",scientific:"Coriandrum sativum",family:"Apiaceae",group:"Spice",clue:"পাতা ও শুকনো ফল মসলা; পুষ্পমঞ্জরি ছাতার মতো।"},
  {bn:"জিরা",en:"Cumin",scientific:"Cuminum cyminum",family:"Apiaceae",group:"Spice",clue:"সরু বিভক্ত পাতা; শুকনো ফল মসলা হিসেবে ব্যবহৃত।"},
  {bn:"মেথি",en:"Fenugreek",scientific:"Trigonella foenum-graecum",family:"Fabaceae",group:"Spice and pulse",clue:"তিন পত্রকবিশিষ্ট পাতা; পাতা ও বীজ মসলা হিসেবে ব্যবহৃত।"},
  {bn:"তেজপাতা",en:"Indian bay leaf",scientific:"Cinnamomum tamala",family:"Lauraceae",group:"Spice tree",clue:"সুগন্ধি পাতা; পাতায় সাধারণত তিনটি প্রধান শিরা গোড়া থেকে ছড়ায়।"},
  {bn:"দারুচিনি",en:"Cinnamon",scientific:"Cinnamomum verum",family:"Lauraceae",group:"Spice tree",clue:"কাণ্ডের ভেতরের বাকল শুকিয়ে মসলা হিসেবে ব্যবহৃত হয়।"},
  {bn:"এলাচ",en:"Cardamom",scientific:"Elettaria cardamomum",family:"Zingiberaceae",group:"Spice",clue:"ভূগর্ভস্থ rhizome থেকে পাতা ও ফুলের কাণ্ড; সুগন্ধি ক্যাপসুল ফল।"},
  {bn:"লবঙ্গ",en:"Clove",scientific:"Syzygium aromaticum",family:"Myrtaceae",group:"Spice tree",clue:"শুকনো অপরিণত ফুলের কুঁড়ি মসলা হিসেবে ব্যবহৃত হয়।"},
  {bn:"তুলা",en:"Upland cotton",scientific:"Gossypium hirsutum",family:"Malvaceae",group:"Fibre crop",clue:"ফল ক্যাপসুল; বীজের গায়ে লম্বা তুলার আঁশ থাকে।"},
  {bn:"নীল",en:"True indigo",scientific:"Indigofera tinctoria",family:"Fabaceae",group:"Dye plant",clue:"ছোট যৌগিক পাতা; ঐতিহ্যগতভাবে নীল রঞ্জক তৈরিতে ব্যবহৃত।"},
  {bn:"ধৈঞ্চা",en:"Sesbania",scientific:"Sesbania bispinosa",family:"Fabaceae",group:"Green manure",clue:"দ্রুতবর্ধনশীল ডালজাতীয় উদ্ভিদ; সবুজ সার ও মাটির জৈব পদার্থ বাড়াতে ব্যবহৃত।"},
  {bn:"কচুরিপানা",en:"Water hyacinth",scientific:"Pontederia crassipes",family:"Pontederiaceae",group:"Aquatic plant",clue:"ভাসমান জলজ উদ্ভিদ; ফুল বেগুনি এবং পাতার বোঁটা স্ফীত।"},
  {bn:"হোগলা",en:"Bulrush",scientific:"Typha angustifolia",family:"Typhaceae",group:"Wetland plant",clue:"জলাভূমিতে জন্মে; লম্বা সরু পাতা ও বাদামি নলাকার পুষ্পমঞ্জরি।"},
  {bn:"খাগড়া",en:"Common reed",scientific:"Phragmites karka",family:"Poaceae",group:"Wetland plant",clue:"জলাভূমির লম্বা ঘাস; বড় পালকের মতো পুষ্পমঞ্জরি হয়।"},
  {bn:"দূর্বা",en:"Bermuda grass",scientific:"Cynodon dactylon",family:"Poaceae",group:"Grass and weed",clue:"মাটির ওপর stolon ও নিচে rhizome ছড়িয়ে দ্রুত বিস্তার করে।"},
  {bn:"শামা ঘাস",en:"Barnyard grass",scientific:"Echinochloa crus-galli",family:"Poaceae",group:"Grass and weed",clue:"ধানক্ষেতের পরিচিত আগাছা; শীষে ঘন শাখা ও খসখসে spikelet থাকে।"},
  {bn:"মুথা",en:"Purple nutsedge",scientific:"Cyperus rotundus",family:"Cyperaceae",group:"Grass and weed",clue:"ত্রিকোণাকার কাণ্ড; ভূগর্ভস্থ কন্দ ও rhizome দিয়ে ছড়ায়।"},
  {bn:"আকন্দ",en:"Giant milkweed",scientific:"Calotropis gigantea",family:"Apocynaceae",group:"Wild and medicinal plant",clue:"মোটা ধূসর-সবুজ পাতা; কাণ্ড ভাঙলে দুধের মতো latex বের হয়।"},
  {bn:"বাসক",en:"Malabar nut",scientific:"Justicia adhatoda",family:"Acanthaceae",group:"Medicinal plant",clue:"বিপরীতমুখী পাতা ও সাদা ফুলে বেগুনি দাগ দেখা যায়।"},
  {bn:"থানকুনি",en:"Indian pennywort",scientific:"Centella asiatica",family:"Apiaceae",group:"Medicinal plant",clue:"মাটিতে বিছিয়ে বাড়ে; গোলাকার কিডনি-আকৃতির পাতা ও লম্বা বোঁটা।"},
  {bn:"কালমেঘ",en:"Green chiretta",scientific:"Andrographis paniculata",family:"Acanthaceae",group:"Medicinal plant",clue:"তিক্ত স্বাদের সরল পাতা; ছোট সাদা-বেগুনি ফুল।"},
  {bn:"ঘৃতকুমারী",en:"Aloe vera",scientific:"Aloe vera",family:"Asphodelaceae",group:"Medicinal plant",clue:"রসালো পাতার কিনারায় ছোট কাঁটা; পাতার ভেতরে স্বচ্ছ জেল থাকে।"},
  {bn:"তুলসী",en:"Holy basil",scientific:"Ocimum tenuiflorum",family:"Lamiaceae",group:"Medicinal and aromatic plant",clue:"সুগন্ধি বিপরীতমুখী পাতা; কাণ্ড চতুষ্কোণ হতে পারে।"},
  {bn:"পুদিনা",en:"Mint",scientific:"Mentha spicata",family:"Lamiaceae",group:"Herb",clue:"সুগন্ধি বিপরীত পাতা; কাণ্ডে গিঁট থেকে সহজে শিকড় গজায়।"},
  {bn:"লেমনগ্রাস",en:"Lemongrass",scientific:"Cymbopogon citratus",family:"Poaceae",group:"Aromatic grass",clue:"গুচ্ছাকারে বাড়ে; পাতা ঘষলে লেবুর মতো গন্ধ পাওয়া যায়।"},
  {bn:"ভেটিভার",en:"Vetiver",scientific:"Chrysopogon zizanioides",family:"Poaceae",group:"Aromatic grass",clue:"গভীর ও ঘন শিকড়; মাটি ক্ষয় রোধে ব্যবহার করা হয়।"},
  {bn:"নেপিয়ার ঘাস",en:"Napier grass",scientific:"Cenchrus purpureus",family:"Poaceae",group:"Fodder crop",clue:"উচ্চ ফলনশীল বহুবর্ষজীবী ঘাস; পশুখাদ্য হিসেবে কাটা হয়।"},
  {bn:"বারসিম",en:"Egyptian clover",scientific:"Trifolium alexandrinum",family:"Fabaceae",group:"Fodder crop",clue:"শীতকালীন ডালজাতীয় ঘাস; তিন পত্রকবিশিষ্ট পাতা ও ঘন ফুলের মাথা।"},
  {bn:"লুসার্ন",en:"Alfalfa",scientific:"Medicago sativa",family:"Fabaceae",group:"Fodder crop",clue:"গভীর শিকড় ও তিন পত্রকবিশিষ্ট পাতা; বহুবর্ষজীবী পশুখাদ্য।"},
  {bn:"গোলাপজাম",en:"Rose apple",scientific:"Syzygium jambos",family:"Myrtaceae",group:"Fruit tree",clue:"সুগন্ধি গোলাপের মতো ঘ্রাণযুক্ত ফল; গাছ চিরসবুজ।"},
  {bn:"জামরুল",en:"Wax apple",scientific:"Syzygium samarangense",family:"Myrtaceae",group:"Fruit tree",clue:"ঘণ্টা বা নাশপাতির মতো রসালো ফল; জলীয় অংশ বেশি।"},
  {bn:"পানিয়াল",en:"Paniala",scientific:"Flacourtia jangomas",family:"Salicaceae",group:"Fruit tree",clue:"ছোট গোলাকার টক-মিষ্টি ফল; কাঁটাযুক্ত ডাল থাকতে পারে।"},
  {bn:"বন পেয়ারা",en:"Strawberry guava",scientific:"Psidium cattleyanum",family:"Myrtaceae",group:"Fruit tree",clue:"ছোট লাল বা হলুদ ফল; পাতায় বিপরীত বিন্যাস।"},
  {bn:"বন জাম",en:"Malay apple",scientific:"Syzygium malaccense",family:"Myrtaceae",group:"Fruit tree",clue:"বড় গোলাপি-লাল ফল ও আকর্ষণীয় ফুল; আর্দ্র অঞ্চলে জন্মে।"},
  {bn:"গাব",en:"Black-and-white ebony",scientific:"Diospyros malabarica",family:"Ebenaceae",group:"Fruit tree",clue:"কাঁচা ফলে কষ থাকে; পরিণত ফল গোলাকার।"},
  {bn:"খেজুর",en:"Date palm",scientific:"Phoenix sylvestris",family:"Arecaceae",group:"Palm",clue:"বাংলাদেশে রস সংগ্রহে ব্যবহৃত; কাণ্ডে পাতার গোড়ার দাগ থাকে।"},
  {bn:"গোলপাতা",en:"Nipa palm",scientific:"Nypa fruticans",family:"Arecaceae",group:"Mangrove palm",clue:"জোয়ার-ভাটার কাদামাটিতে জন্মে; ফলের বড় গোলাকার গুচ্ছ হয়।"},
  {bn:"হেতাল",en:"Mangrove date palm",scientific:"Phoenix paludosa",family:"Arecaceae",group:"Mangrove palm",clue:"উপকূলীয় লবণাক্ত জলাভূমিতে জন্মে; ঝোপালো পাম।"},
  {bn:"বেত",en:"Rattan",scientific:"Calamus tenuis",family:"Arecaceae",group:"Climbing palm",clue:"কাঁটাযুক্ত আরোহী পাম; কাণ্ড বেতের কাজে ব্যবহৃত হয়।"},
  {bn:"জালি বেত",en:"Jali rattan",scientific:"Calamus guruba",family:"Arecaceae",group:"Climbing palm",clue:"বনাঞ্চলে আরোহীভাবে বাড়ে; কাণ্ড নমনীয় ও আঁশযুক্ত।"},
  {bn:"চিনি তাল",en:"Sugar palm",scientific:"Arenga pinnata",family:"Arecaceae",group:"Palm",clue:"রস ও আঁশের জন্য পরিচিত; পাতার খণ্ড লম্বা।"},
  {bn:"তালিপট",en:"Talipot palm",scientific:"Corypha umbraculifera",family:"Arecaceae",group:"Palm",clue:"বিশাল পাখার মতো পাতা; জীবনে একবার বিশাল পুষ্পমঞ্জরি দেয়।"},
  {bn:"বন সুপারি",en:"Fishtail palm",scientific:"Caryota urens",family:"Arecaceae",group:"Palm",clue:"পাতার খণ্ড মাছের লেজের মতো; ফলের রসে জ্বালাপোড়া হতে পারে।"},
  {bn:"তেলপাম",en:"African oil palm",scientific:"Elaeis guineensis",family:"Arecaceae",group:"Oil crop",clue:"ঘন ফলের থোকা থেকে তেল পাওয়া যায়; পালকাকৃতির বড় পাতা।"},
  {bn:"আকাশমণি",en:"Earleaf acacia",scientific:"Acacia auriculiformis",family:"Fabaceae",group:"Timber tree",clue:"চ্যাপ্টা phyllode পাতার মতো দেখায়; দ্রুতবর্ধনশীল বনজ গাছ।"},
  {bn:"ম্যাঙ্গিয়াম",en:"Mangium",scientific:"Acacia mangium",family:"Fabaceae",group:"Timber tree",clue:"দ্রুতবর্ধনশীল গাছ; প্রশস্ত phyllode ও শুঁটি থাকে।"},
  {bn:"রক্তচন্দন",en:"Red sandalwood",scientific:"Pterocarpus santalinus",family:"Fabaceae",group:"Timber tree",clue:"কাঠ লালচে; যৌগিক পাতায় কয়েকটি পত্রক থাকে।"},
  {bn:"খয়ের",en:"Catechu tree",scientific:"Senegalia catechu",family:"Fabaceae",group:"Timber tree",clue:"কাঁটাযুক্ত ডাল ও যৌগিক পাতা; বাকল থেকে ঐতিহ্যগত কষজাত পদার্থ পাওয়া যায়।"},
  {bn:"রেইনট্রি",en:"Rain tree",scientific:"Samanea saman",family:"Fabaceae",group:"Shade tree",clue:"বড় ছাতার মতো মুকুট; সন্ধ্যায় পত্রক ভাঁজ হয়ে যায়।"},
  {bn:"অশোক",en:"Ashoka tree",scientific:"Saraca asoca",family:"Fabaceae",group:"Flowering tree",clue:"গুচ্ছবদ্ধ কমলা-লাল ফুল; নতুন পাতা ঝুলন্ত ও রঙিন।"},
  {bn:"কাঞ্চন",en:"Purple orchid tree",scientific:"Bauhinia purpurea",family:"Fabaceae",group:"Flowering tree",clue:"পাতা উটের খুরের মতো দুই খণ্ডে বিভক্ত; বেগুনি ফুল।"},
  {bn:"সাদা কাঞ্চন",en:"White orchid tree",scientific:"Bauhinia acuminata",family:"Fabaceae",group:"Flowering shrub",clue:"দুই খণ্ডবিশিষ্ট পাতার সঙ্গে সাদা ফুল ফোটে।"},
  {bn:"শিরীষ",en:"Siris tree",scientific:"Albizia lebbeck",family:"Fabaceae",group:"Shade tree",clue:"পাতা দ্বিপক্ষল যৌগিক; চ্যাপ্টা শুঁটি বাতাসে শব্দ করতে পারে।"},
  {bn:"কড়ই",en:"Pink siris",scientific:"Albizia saman",family:"Fabaceae",group:"Shade tree",clue:"বিস্তৃত ছায়াদানকারী মুকুট; গোলাপি-সাদা পুষ্পমঞ্জরি।"},
  {bn:"শিম",en:"Hyacinth bean",scientific:"Lablab purpureus",family:"Fabaceae",group:"Vegetable",clue:"লতানো ডাল; বেগুনি বা সাদা ফুল এবং চ্যাপ্টা শুঁটি।"},
  {bn:"বরবটির বুনো আত্মীয়",en:"Cowpea",scientific:"Vigna unguiculata subsp. unguiculata",family:"Fabaceae",group:"Pulse crop",clue:"ডালজাতীয় উদ্ভিদ; শুঁটি লম্বা এবং বীজ বিভিন্ন রঙের।"},
  {bn:"কুলেখাড়া",en:"Hygrophila",scientific:"Hygrophila auriculata",family:"Acanthaceae",group:"Wetland herb",clue:"জলাভূমির কাঁটাযুক্ত ভেষজ; পাতার গোড়ায় কাঁটা থাকতে পারে।"},
  {bn:"হেলেঞ্চা",en:"Marsh barbel",scientific:"Enhydra fluctuans",family:"Asteraceae",group:"Leafy vegetable",clue:"জলাভূমিতে জন্মানো ভেষজ; কচি ডগা শাক হিসেবে খাওয়া হয়।"},
  {bn:"কলমি",en:"Water spinach",scientific:"Ipomoea aquatica",family:"Convolvulaceae",group:"Leafy vegetable",clue:"জলজ বা স্যাঁতসেঁতে স্থানে লতিয়ে বাড়ে; ফাঁপা কাণ্ড থাকে।"},
  {bn:"নটে শাক",en:"Slender amaranth",scientific:"Amaranthus viridis",family:"Amaranthaceae",group:"Leafy vegetable",clue:"সবুজ সরল পাতা; ছোট ফুল ঘন শীষে ধরে।"},
  {bn:"বথুয়া",en:"Lamb's quarters",scientific:"Chenopodium album",family:"Amaranthaceae",group:"Leafy vegetable",clue:"পাতায় সাদা গুঁড়ার মতো আবরণ থাকতে পারে; শীতকালীন আগাছা-শাক।"},
  {bn:"পুঁই লতা",en:"Malabar spinach",scientific:"Basella rubra",family:"Basellaceae",group:"Leafy vegetable",clue:"লালচে লতানো কাণ্ড; রসালো পাতা শাক হিসেবে ব্যবহৃত।"},
  {bn:"কাসুন্দি সরিষা",en:"Brown mustard",scientific:"Brassica nigra",family:"Brassicaceae",group:"Oilseed crop",clue:"ছোট গোলাকার বীজ; চার পাপড়ির হলুদ ফুল ও সরু ফল।"},
  {bn:"চীনা বাঁধাকপি",en:"Chinese cabbage",scientific:"Brassica rapa subsp. pekinensis",family:"Brassicaceae",group:"Vegetable",clue:"পাতা দিয়ে ঢিলেঢালা বা ঘন head তৈরি হয়।"},
  {bn:"শালগম",en:"Turnip",scientific:"Brassica rapa subsp. rapa",family:"Brassicaceae",group:"Vegetable",clue:"স্ফীত মূল খাদ্যযোগ্য; পাতা শাক হিসেবেও খাওয়া হয়।"},
  {bn:"ব্রকলি",en:"Broccoli",scientific:"Brassica oleracea var. italica",family:"Brassicaceae",group:"Vegetable",clue:"ঘন সবুজ অপরিণত ফুলের গুচ্ছ খাওয়া হয়।"},
  {bn:"কেল",en:"Kale",scientific:"Brassica oleracea var. sabellica",family:"Brassicaceae",group:"Leafy vegetable",clue:"খোলা কোঁকড়ানো পাতা; head তৈরি করে না।"},
  {bn:"লাল বাঁধাকপি",en:"Red cabbage",scientific:"Brassica oleracea var. capitata f. rubra",family:"Brassicaceae",group:"Vegetable",clue:"পাতার anthocyanin রঞ্জকে লাল-বেগুনি রঙ হয়।"},
  {bn:"পেঁপে গাছের বুনো আত্মীয়",en:"Vasconcellea",scientific:"Vasconcellea pubescens",family:"Caricaceae",group:"Fruit tree",clue:"পেঁপে-জাতীয় ফল; শীতল উঁচু অঞ্চলে চাষযোগ্য আত্মীয় প্রজাতি।"},
  {bn:"বাতাবি লেবু",en:"Pomelo",scientific:"Citrus maxima",family:"Rutaceae",group:"Fruit",clue:"বড় সাইট্রাস ফল; খোসা পুরু ও কোয়া বড়।"},
  {bn:"কাগজি লেবু",en:"Key lime",scientific:"Citrus aurantiifolia",family:"Rutaceae",group:"Fruit",clue:"ছোট গোলাকার টক ফল; কাঁটাযুক্ত ডাল থাকতে পারে।"},
  {bn:"কমলালেবু",en:"Mandarin orange",scientific:"Citrus reticulata",family:"Rutaceae",group:"Fruit",clue:"খোসা তুলনামূলক সহজে ছাড়ানো যায়; ফল খণ্ডে বিভক্ত।"},
  {bn:"জাম্বুরা",en:"Grapefruit",scientific:"Citrus × paradisi",family:"Rutaceae",group:"Fruit",clue:"বড় সাইট্রাস ফল; টক-মিষ্টি শাঁস ও পুরু খোসা।"},
  {bn:"কদবেল",en:"Wood apple",scientific:"Limonia acidissima",family:"Rutaceae",group:"Fruit tree",clue:"কঠিন খোসার ফল; পাতায় সাইট্রাসের মতো গন্ধ।"},
  {bn:"কামরাঙ্গা",en:"Bilimbi",scientific:"Averrhoa bilimbi",family:"Oxalidaceae",group:"Fruit",clue:"লম্বাটে টক ফল; ডালে গুচ্ছ ধরে।"},
  {bn:"চালতা",en:"Elephant apple",scientific:"Dillenia indica",family:"Dilleniaceae",group:"Fruit tree",clue:"বড় গোল ফল; পুরু মাংসল বৃতি ফলকে ঘিরে থাকে।"},
  {bn:"লটকন",en:"Burmese grape",scientific:"Baccaurea ramiflora",family:"Phyllanthaceae",group:"Fruit tree",clue:"গুচ্ছবদ্ধ হলুদ-কমলা ফল; শাঁস টক-মিষ্টি।"},
  {bn:"আঁশফল",en:"Longan",scientific:"Dimocarpus longan",family:"Sapindaceae",group:"Fruit tree",clue:"ছোট গোল ফল; স্বচ্ছ শাঁসের ভেতরে গাঢ় বীজ থাকে।"},
  {bn:"রামবুটান",en:"Rambutan",scientific:"Nephelium lappaceum",family:"Sapindaceae",group:"Fruit tree",clue:"ফলের খোসায় নরম চুলের মতো অংশ থাকে।"},
  {bn:"ডুমুর",en:"Cluster fig",scientific:"Ficus racemosa",family:"Moraceae",group:"Wild fruit tree",clue:"কাণ্ড ও মোটা ডালে গুচ্ছবদ্ধ syconium ফল ধরে।"},
  {bn:"পাকুড়",en:"White fig",scientific:"Ficus virens",family:"Moraceae",group:"Shade tree",clue:"বিস্তৃত মুকুট; বায়বীয় শিকড় ও ছোট syconium ফল হতে পারে।"},
  {bn:"অশ্বত্থ",en:"Sacred fig",scientific:"Ficus religiosa",family:"Moraceae",group:"Sacred shade tree",clue:"হৃদপিণ্ডাকৃতির পাতার লম্বা সূচালো অগ্রভাগ থাকে।"},
  {bn:"জগডুমুর",en:"Creeping fig",scientific:"Ficus pumila",family:"Moraceae",group:"Climber",clue:"আঠালো aerial root দিয়ে দেয়াল বা গাছে আঁকড়ে ওঠে।"},
  {bn:"কাঁঠালিচাঁপা",en:"Champak",scientific:"Magnolia champaca",family:"Magnoliaceae",group:"Flowering tree",clue:"তীব্র সুগন্ধি হলুদ-কমলা ফুল; চিরসবুজ গাছ।"},
  {bn:"নাগকেশর",en:"Ceylon ironwood",scientific:"Mesua ferrea",family:"Calophyllaceae",group:"Forest tree",clue:"সাদা সুগন্ধি ফুলে বহু হলুদ পুংকেশর; পাতা সরু ও চকচকে।"},
  {bn:"কানাইডিঙ্গা",en:"Alexandrian laurel",scientific:"Calophyllum inophyllum",family:"Calophyllaceae",group:"Coastal tree",clue:"উপকূলীয় সহনশীল গাছ; পাতায় সমান্তরাল সূক্ষ্ম শিরা দেখা যায়।"},
  {bn:"গর্জন",en:"Garjan",scientific:"Dipterocarpus turbinatus",family:"Dipterocarpaceae",group:"Forest tree",clue:"বড় বনজ গাছ; ফলের সঙ্গে লম্বা ডানার মতো বৃতি থাকে।"},
  {bn:"চাপালিশ",en:"Chapalish",scientific:"Artocarpus chama",family:"Moraceae",group:"Forest tree",clue:"বনজ ফলদ গাছ; পাতার আকৃতি বয়সভেদে ভিন্ন হতে পারে।"},
  {bn:"বহেরা",en:"Beleric myrobalan",scientific:"Terminalia bellirica",family:"Combretaceae",group:"Medicinal tree",clue:"বড় পাতা ডালের আগায় গুচ্ছ হয়; ফল ত্রিফলার একটি উপাদান।"},
  {bn:"হরিতকী",en:"Chebulic myrobalan",scientific:"Terminalia chebula",family:"Combretaceae",group:"Medicinal tree",clue:"ডিম্বাকার খাঁজযুক্ত ফল; ত্রিফলার একটি উপাদান।"},
  {bn:"আমলকী",en:"Indian gooseberry",scientific:"Phyllanthus emblica",family:"Phyllanthaceae",group:"Fruit tree",clue:"ছোট পত্রকযুক্ত পাতা; গোলাকার খাঁজযুক্ত টক ফল।"},
  {bn:"কড়ই",en:"Siris",scientific:"Albizia procera",family:"Fabaceae",group:"Timber tree",clue:"হালকা রঙের বাকল; দ্বিপক্ষল যৌগিক পাতা ও চ্যাপ্টা শুঁটি।"},
  {bn:"ইপিল ইপিল",en:"Lead tree",scientific:"Leucaena leucocephala",family:"Fabaceae",group:"Fodder and green manure",clue:"ছোট পত্রকযুক্ত যৌগিক পাতা; দ্রুতবর্ধনশীল ডালজাতীয় গাছ।"},
  {bn:"গ্লিরিসিডিয়া",en:"Gliricidia",scientific:"Gliricidia sepium",family:"Fabaceae",group:"Green manure tree",clue:"গুচ্ছবদ্ধ গোলাপি ফুল; জীবন্ত বেড়া ও সবুজ সার হিসেবে ব্যবহৃত।"},
  {bn:"ধুন্দুল বন",en:"Ceylon spinach",scientific:"Talinum fruticosum",family:"Talinaceae",group:"Leafy vegetable",clue:"রসালো পাতা ও কাণ্ড; গরমে সহজে জন্মে।"},
  {bn:"পাথরকুচি",en:"Life plant",scientific:"Kalanchoe pinnata",family:"Crassulaceae",group:"Medicinal plant",clue:"পাতার কিনারায় ছোট plantlet গজাতে পারে; রসালো পাতা।"},
  {bn:"নিশিন্দা",en:"Five-leaved chaste tree",scientific:"Vitex negundo",family:"Lamiaceae",group:"Medicinal shrub",clue:"সাধারণত পাঁচ পত্রকবিশিষ্ট পাতা; পাতায় তীব্র গন্ধ।"},
  {bn:"মেহেদি",en:"Henna",scientific:"Lawsonia inermis",family:"Lythraceae",group:"Dye plant",clue:"ছোট বিপরীত পাতা; ফুল সুগন্ধি এবং পাতা রঞ্জক হিসেবে ব্যবহৃত।"},
  {bn:"রক্তকরবী",en:"Oleander",scientific:"Nerium oleander",family:"Apocynaceae",group:"Ornamental shrub",clue:"সরু চামড়ার মতো পাতা ও গুচ্ছ ফুল; উদ্ভিদটি বিষাক্ত।"},
  {bn:"করবী",en:"Yellow oleander",scientific:"Cascabela thevetia",family:"Apocynaceae",group:"Ornamental shrub",clue:"হলুদ funnel-আকৃতির ফুল; সব অংশ বিষাক্ত, খাওয়া যাবে না।"},
  {bn:"কৃষ্ণতুলসী",en:"African basil",scientific:"Ocimum gratissimum",family:"Lamiaceae",group:"Aromatic herb",clue:"পাতা ও কাণ্ড সুগন্ধি; ছোট ফুল শীষে ধরে।"},
  {bn:"রজনীগন্ধা",en:"Tuberose",scientific:"Agave amica",family:"Asparagaceae",group:"Flowering plant",clue:"লম্বা ফুলের মঞ্জরি; সাদা ফুল রাতে সুগন্ধ ছড়ায়।"},
  {bn:"গাঁদা",en:"African marigold",scientific:"Tagetes erecta",family:"Asteraceae",group:"Flowering plant",clue:"গোলাকার হলুদ বা কমলা ফুলের মাথা; শোভাবর্ধক ও কাট-ফ্লাওয়ার।"},
  {bn:"সূর্যমুখী বুনো",en:"Mexican sunflower",scientific:"Tithonia diversifolia",family:"Asteraceae",group:"Flowering shrub",clue:"বড় হলুদ-কমলা ফুলের মাথা; দ্রুতবর্ধনশীল শোভাবর্ধক উদ্ভিদ।"},
  {bn:"দুধকলমি",en:"Pink morning glory",scientific:"Ipomoea carnea",family:"Convolvulaceae",group:"Wetland shrub",clue:"জলাভূমির ঝোপ; গোলাপি trumpet-আকৃতির ফুল; গাছের অংশ বিষাক্ত হতে পারে।"},
  {bn:"শাপলা",en:"Water lily",scientific:"Nymphaea nouchali",family:"Nymphaeaceae",group:"Aquatic plant",clue:"জলপৃষ্ঠে ভাসমান পাতা ও নীল-বেগুনি ফুল; বাংলাদেশের জাতীয় ফুল।"},
  {bn:"পদ্ম",en:"Sacred lotus",scientific:"Nelumbo nucifera",family:"Nelumbonaceae",group:"Aquatic plant",clue:"পাতা ও ফুল জলপৃষ্ঠের ওপরে উঠে থাকে; বীজের শুঁটি চাকতির মতো।"},
  {bn:"শোলা",en:"Indian sponge plant",scientific:"Aeschynomene aspera",family:"Fabaceae",group:"Wetland plant",clue:"জলাভূমির নরম কাণ্ড; শুকনো কাণ্ড দিয়ে শোলার কাজ হয়।"},
  {bn:"কাঁশ",en:"Kans grass",scientific:"Saccharum spontaneum",family:"Poaceae",group:"Grass and weed",clue:"সাদা রূপালি পালকের মতো পুষ্পমঞ্জরি; নদীর চর ও বালুচরে জন্মে।"},
  {bn:"বন আখ",en:"Wild sugarcane",scientific:"Tripidium arundinaceum",family:"Poaceae",group:"Grass and weed",clue:"লম্বা ঘাস; পুষ্পমঞ্জরি বড় ও পালকের মতো।"},
  {bn:"ধানশি",en:"Wild rice",scientific:"Oryza rufipogon",family:"Poaceae",group:"Wild relative",clue:"ধানের বুনো আত্মীয়; জলাভূমিতে জন্মে এবং লম্বা awn থাকতে পারে।"},
  {bn:"জংলি ধান",en:"Wild rice",scientific:"Oryza coarctata",family:"Poaceae",group:"Wild relative",clue:"উপকূলীয় লবণাক্ত কাদায় জন্মানো বুনো ধানজাতীয় ঘাস।"},
  {bn:"কাগজিফুল",en:"Bougainvillea",scientific:"Bougainvillea spectabilis",family:"Nyctaginaceae",group:"Ornamental climber",clue:"রঙিন অংশগুলো প্রকৃত পাপড়ি নয়, bract; কাঁটাযুক্ত আরোহী ঝোপ।"},
  {bn:"জারুল",en:"Queen's crape-myrtle",scientific:"Lagerstroemia speciosa",family:"Lythraceae",group:"Flowering tree",clue:"বেগুনি ফুলের বড় গুচ্ছ; বাকল খসে পড়তে পারে।"},
];

const modes = [
  {id:"library",label:"গাছের লাইব্রেরি",icon:"🌳"},
  {id:"cards",label:"ফ্ল্যাশকার্ড",icon:"🗂️"},
  {id:"quiz",label:"কুইজ",icon:"🧠"},
] as const;
type Mode = typeof modes[number]["id"];

export default function PlantSciencePage() {
  const [mode,setMode] = useState<Mode>("library");
  const [query,setQuery] = useState("");
  const [group,setGroup] = useState("All");
  const [index,setIndex] = useState(0);
  const [revealed,setRevealed] = useState(false);
  const [quizIndex,setQuizIndex] = useState(0);
  const [choice,setChoice] = useState("");
  const [score,setScore] = useState(0);
  const [answered,setAnswered] = useState(false);
  const [known,setKnown] = useState<string[]>([]);
  const [review,setReview] = useState<string[]>([]);
  const [reviewOnly,setReviewOnly] = useState(false);
  const [ready,setReady] = useState(false);
  useEffect(()=>{try { const raw=localStorage.getItem("agriva-plant-learning-v1"); if(raw){const p=JSON.parse(raw);setKnown(Array.isArray(p.known)?p.known:[]);setReview(Array.isArray(p.review)?p.review:[]);} } catch {} setReady(true);},[]);
  useEffect(()=>{if(ready){try{localStorage.setItem("agriva-plant-learning-v1",JSON.stringify({known,review}));}catch{}}},[known,review,ready]);

  const groups = useMemo(()=>["All",...Array.from(new Set(plants.map(p=>p.group)))],[ ]);
  const filtered = useMemo(()=>plants.filter(p=>(group==="All"||p.group===group)&&(!reviewOnly||review.includes(p.scientific))&&[p.bn,p.en,p.scientific,p.family,p.group].some(v=>v.toLowerCase().includes(query.toLowerCase().trim()))),[group,query,reviewOnly,review]);
  const current = filtered.length ? filtered[index % filtered.length] : plants[0];
  const question = plants[quizIndex % plants.length];
  const options = useMemo(()=> {
    const wrong=plants.filter(p=>p.scientific!==question.scientific).sort((a,b)=>a.scientific.localeCompare(b.scientific)).slice((quizIndex*3)%Math.max(1,plants.length-3),(quizIndex*3)%Math.max(1,plants.length-3)+3);
    return [...wrong,question].sort((a,b)=>a.scientific.localeCompare(b.scientific));
  },[question,quizIndex]);
  const choose = (answer:string) => { if(answered)return;setChoice(answer);setAnswered(true); if(answer===question.scientific){setScore(s=>s+1);setKnown(prev=>prev.includes(question.scientific)?prev:[...prev,question.scientific]);}else{setReview(prev=>prev.includes(question.scientific)?prev:[...prev,question.scientific]);} };
  const nextQuestion = () => {setQuizIndex(i=>i+1);setChoice("");setAnswered(false);};
  const nextCard = (delta:number) => {setIndex(i=>(i+delta+Math.max(filtered.length,1))%Math.max(filtered.length,1));setRevealed(false);};
  return <main className="min-h-screen bg-[#f4f8f1] text-slate-900">
    <header className="bg-gradient-to-br from-[#103f2b] via-[#14532d] to-[#39834a] px-4 py-9 text-white sm:px-6">
      <div className="mx-auto max-w-6xl"><Link href="/learn" className="text-sm font-bold text-emerald-100 hover:underline">← AGRIVA</Link>
        <p className="mt-5 text-xs font-black uppercase tracking-[.2em] text-lime-200">PLANT SCIENCE ACADEMY</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">গাছ চিনুন, বৈজ্ঞানিক নাম মনে রাখুন</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">কৃষিবিদ ও কৃষি সম্প্রসারণকর্মীদের জন্য গাছের নাম, উদ্ভিদ পরিবার ও বৈশিষ্ট্য দ্রুত রিভিশনের বাংলা-ইংরেজি অনুশীলন টুল।</p>
        <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">{[{v:plants.length,l:"গাছের তথ্য"},{v:known.length,l:"জানা হয়েছে"},{v:review.length,l:"আবার দেখুন"}].map(s=><div key={s.l} className="rounded-xl border border-white/15 bg-white/10 p-3"><div className="text-2xl font-black">{s.v}</div><div className="mt-1 text-xs text-emerald-100">{s.l}</div></div>)}</div><div className="mt-5 max-w-xl"><div className="flex justify-between text-xs font-bold text-emerald-50"><span>আজকের শেখার লক্ষ্য</span><span>{Math.min(known.length,5)}/৫</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-lime-300 transition-all" style={{width:`${Math.min(known.length,5)*20}%`}}/></div><p className="mt-2 text-xs text-emerald-100">প্রতিদিন ৫টি বৈজ্ঞানিক নাম মনে রাখার চেষ্টা করুন।</p></div>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">{modes.map(m=><button key={m.id} onClick={()=>setMode(m.id)} className={"rounded-xl border p-4 text-left "+(mode===m.id?"border-emerald-700 bg-emerald-50 ring-2 ring-emerald-100":"border-slate-200 bg-white hover:border-emerald-300")}><span className="text-xl">{m.icon}</span><span className="mt-2 block font-extrabold">{m.label}</span></button>)}</div>

      {mode==="library"&&<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="বাংলা, English বা Scientific name দিয়ে খুঁজুন…" className="min-h-12 flex-1 rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-700"/><select value={group} onChange={e=>setGroup(e.target.value)} className="min-h-12 rounded-xl border border-slate-200 bg-white px-3">{groups.map(g=><option key={g} value={g}>{g==="All"?"সব বিভাগ":g}</option>)}</select></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{filtered.length}টি গাছ পাওয়া গেছে{reviewOnly?" (পুনরায় শেখার তালিকা)":""}</p><div className="flex flex-wrap gap-2"><button onClick={()=>setReviewOnly(v=>!v)} className={"rounded-lg border px-3 py-2 text-sm font-bold "+(reviewOnly?"border-amber-400 bg-amber-50 text-amber-900":"border-slate-200 bg-white text-slate-700")}>{reviewOnly?"সব গাছ দেখুন":"শুধু আবার শিখব ("+review.length+")"}</button><button onClick={()=>{const pool=plants.filter(p=>!known.includes(p.scientific));const pick=pool.length?pool[Math.floor(Math.random()*pool.length)]:plants[Math.floor(Math.random()*plants.length)];setReviewOnly(false);setQuery("");setGroup("All");setIndex(Math.max(0,plants.findIndex(p=>p.scientific===pick.scientific)));setRevealed(false);setMode("cards");}} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">🎲 এলোমেলো গাছ শিখি</button></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(p=><article key={p.scientific} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-lg font-black">{p.bn}</p><p className="text-sm text-slate-500">{p.en}</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">{p.group}</span></div><p className="mt-4 break-words font-serif text-lg italic text-emerald-800">{p.scientific}</p><p className="mt-2 text-xs font-bold text-slate-500">Family: {p.family}</p><p className="mt-3 text-sm leading-6 text-slate-600">{p.clue}</p><button onClick={()=>{setIndex(Math.max(0,filtered.findIndex(x=>x.scientific===p.scientific)));setRevealed(false);setMode("cards");}} className="mt-4 text-sm font-extrabold text-emerald-800 hover:underline">এই গাছটি অনুশীলন করুন →</button></article>)}</div>
        {filtered.length===0&&<p className="py-10 text-center text-slate-500">মিল পাওয়া যায়নি। অন্য নাম দিয়ে খুঁজুন।</p>}
      </section>}

      {mode==="cards"&&<section className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-500"><span>কার্ড {filtered.length?index%filtered.length+1:0} / {filtered.length}</span><span>কার্ডে চাপ দিয়ে উত্তর দেখুন</span></div>
        <button onClick={()=>setRevealed(v=>!v)} className="min-h-[300px] w-full rounded-3xl border border-emerald-900/10 bg-white p-8 text-center shadow-lg transition hover:shadow-xl">
          <span className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">{revealed?"SCIENTIFIC NAME":"TREE NAME"}</span>
          {!revealed?<><span className="mt-8 block text-4xl font-black">{current.bn}</span><span className="mt-3 block text-lg text-slate-500">{current.en}</span><span className="mt-8 block text-sm text-slate-400">উত্তর দেখতে চাপ দিন</span></>:<><span className="mt-8 block break-words font-serif text-3xl font-bold italic text-emerald-800">{current.scientific}</span><span className="mt-4 block font-bold text-slate-600">Family: {current.family}</span><span className="mx-auto mt-3 block max-w-lg text-sm leading-6 text-slate-500">{current.clue}</span></>}
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3"><button onClick={()=>nextCard(-1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">← আগেরটি</button><button onClick={()=>{setKnown(p=>p.includes(current.scientific)?p:[...p,current.scientific]);setReview(p=>p.filter(x=>x!==current.scientific));nextCard(1);}} className="rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white">জানি ✓</button><button onClick={()=>{setReview(p=>p.includes(current.scientific)?p:[...p,current.scientific]);nextCard(1);}} className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-bold text-amber-900">আবার শিখব ↻</button><button onClick={()=>nextCard(1)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold">পরেরটি →</button></div>
      </section>}

      {mode==="quiz"&&<section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-500">প্রশ্ন {quizIndex+1}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-800">স্কোর: {score}</span></div><h2 className="mt-5 text-xl font-black sm:text-2xl">“{question.bn}” ({question.en}) গাছের বৈজ্ঞানিক নাম কোনটি?</h2><div className="mt-5 grid gap-3">{options.map(o=><button key={o.scientific} disabled={answered} onClick={()=>choose(o.scientific)} className={"rounded-xl border p-4 text-left font-serif text-base italic "+(answered&&o.scientific===question.scientific?"border-emerald-600 bg-emerald-50 text-emerald-900":answered&&choice===o.scientific?"border-red-300 bg-red-50 text-red-800":"border-slate-200 hover:border-emerald-400 disabled:cursor-default")}>{o.scientific}</button>)}</div>{answered&&<div role="status" className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">{choice===question.scientific?<p className="font-bold text-emerald-800">সঠিক উত্তর! ভালো করেছেন।</p>:<p className="font-bold text-amber-800">সঠিক উত্তর: {question.scientific}</p>}<p className="mt-1 text-slate-600">Family: {question.family} · {question.clue}</p></div>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={nextQuestion} disabled={!answered} className="rounded-xl bg-emerald-800 px-5 py-3 font-extrabold text-white disabled:opacity-40">পরের প্রশ্ন →</button><button onClick={()=>{setQuizIndex(0);setScore(0);setChoice("");setAnswered(false);}} className="rounded-xl border border-slate-300 px-5 py-3 font-bold">আবার শুরু</button></div></section>}

      <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>শেখার টিপস:</strong> প্রতিদিন ৫–১০টি নাম অনুশীলন করুন। বৈজ্ঞানিক নামের genus-এর প্রথম অক্ষর বড়, species ছোট হাতের হয়; দুটো শব্দই সাধারণত italic লেখা হয়। উদ্ভিদের বৈজ্ঞানিক নাম ও পরিবার পরীক্ষার আগে আপনার কোর্সের নির্ধারিত রেফারেন্সের সঙ্গে মিলিয়ে নিন।</section>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-center"><Link href="/learn/plant-disease" className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-900">🩺 Plant Disease Learning Lab →</Link><Link href="/learn" className="text-sm font-bold text-emerald-800 hover:underline">কৃষি শেখার কেন্দ্র →</Link></div>
    </div>
  </main>;
}
