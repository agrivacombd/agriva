"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Use the same @supabase/ssr browser client as login so the session cookie is
// shared with the server-side Garden route and middleware.
const supabase = createSupabaseBrowserClient();


type Plant = {
  id: string;
  plant_name: string;
  nickname: string | null;
  plant_type: string;
  location_label: string | null;
  notes: string | null;
  created_at: string;
};

type CareTask = {
  id: string;
  plant_id: string;
  title: string;
  task_type: string;
  due_on: string;
  completed_at: string | null;
  garden_plants?: { plant_name: string } | null;
};

const plantTypes = [
  ["indoor", "ইনডোর প্ল্যান্ট"], ["flower", "ফুলের গাছ"], ["fruit", "ফলের গাছ"],
  ["vegetable", "সবজি"], ["herb", "ভেষজ গাছ"], ["tree", "গাছ / চারা"],
  ["succulent", "ক্যাকটাস / সাকুলেন্ট"], ["other", "অন্যান্য"],
];

const taskTypes = [
  ["water", "পানি দেওয়া"], ["fertilize", "সার দেওয়া"], ["prune", "ছাঁটাই"],
  ["repot", "টব / মাটি বদল"], ["inspect", "গাছ পরীক্ষা"], ["custom", "অন্যান্য"],
];

export default function GardenClient() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [plantName, setPlantName] = useState("");
  const [nickname, setNickname] = useState("");
  const [plantType, setPlantType] = useState("indoor");
  const [locationLabel, setLocationLabel] = useState("");
  const [taskPlantId, setTaskPlantId] = useState("");
  const [taskTitle, setTaskTitle] = useState("গাছের যত্ন পরীক্ষা");
  const [taskType, setTaskType] = useState("inspect");
  const [dueOn, setDueOn] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      window.location.assign("/login?next=%2Fgarden");
      return;
    }
    const [plantResult, taskResult] = await Promise.all([
      supabase.from("garden_plants").select("id,plant_name,nickname,plant_type,location_label,notes,created_at")
        .eq("is_active", true).order("created_at", { ascending: false }).limit(100),
      supabase.from("garden_care_tasks").select("id,plant_id,title,task_type,due_on,completed_at,garden_plants!garden_care_tasks_owner_plant_fk(plant_name)")
        .order("due_on", { ascending: true }).limit(100),
    ]);
    if (plantResult.error || taskResult.error) {
      setNotice("Garden data লোড করা যায়নি। Migration প্রয়োগ হয়েছে কি না যাচাই করুন।");
    } else {
      const nextPlants = (plantResult.data ?? []) as Plant[];
      setPlants(nextPlants);
      setTasks((taskResult.data ?? []) as unknown as CareTask[]);
      if (!taskPlantId && nextPlants[0]) setTaskPlantId(nextPlants[0].id);
    }
    setLoading(false);
  }, [taskPlantId]);

  useEffect(() => { void load(); }, [load]);

  async function addPlant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.assign("/login?next=%2Fgarden"); return; }
    const { error } = await supabase.from("garden_plants").insert({
      owner_id: auth.user.id, plant_name: plantName.trim(), nickname: nickname.trim() || null,
      plant_type: plantType, location_label: locationLabel.trim() || null,
    });
    setSaving(false);
    if (error) { setNotice("গাছ যোগ করা যায়নি। নাম যাচাই করে আবার চেষ্টা করুন।"); return; }
    setPlantName(""); setNickname(""); setLocationLabel("");
    setNotice("আপনার গাছ Garden-এ যোগ হয়েছে।");
    await load();
  }

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskPlantId) return;
    setSaving(true); setNotice("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.assign("/login?next=%2Fgarden"); return; }
    const { error } = await supabase.from("garden_care_tasks").insert({
      owner_id: auth.user.id, plant_id: taskPlantId, title: taskTitle.trim(),
      task_type: taskType, due_on: dueOn,
    });
    setSaving(false);
    if (error) { setNotice("Care task যোগ করা যায়নি। আবার চেষ্টা করুন।"); return; }
    setNotice("Care task সংরক্ষিত হয়েছে।");
    await load();
  }

  async function completeTask(taskId: string) {
    const { error } = await supabase.from("garden_care_tasks")
      .update({ completed_at: new Date().toISOString() }).eq("id", taskId);
    if (error) { setNotice("Task update হয়নি। আবার চেষ্টা করুন।"); return; }
    await load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const openTasks = tasks.filter((task) => !task.completed_at);

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <section className="space-y-5">
        <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">আমার গাছ যোগ করুন</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">প্রথমে গাছের নাম ও ধরন লিখুন। ব্যক্তিগত Garden-এর তথ্য শুধু আপনার account-এ থাকবে।</p>
          <form onSubmit={addPlant} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">গাছের নাম *
              <input required minLength={2} maxLength={120} value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="যেমন: মানি প্ল্যান্ট" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-semibold">নিজের দেওয়া নাম
              <input maxLength={80} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="যেমন: জানালার গাছ" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-semibold">গাছের ধরন
              <select value={plantType} onChange={(e) => setPlantType(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base">
                {plantTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">কোথায় রেখেছেন
              <input maxLength={120} value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} placeholder="যেমন: বারান্দা" className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <button disabled={saving} className="min-h-12 rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:opacity-60 sm:col-span-2">{saving ? "সংরক্ষণ হচ্ছে…" : "＋ আমার গাছ যোগ করুন"}</button>
          </form>
        </div>

        <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">Care task পরিকল্পনা</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">পানি, সার বা গাছ পরীক্ষা করার কাজ ও তারিখ সংরক্ষণ করুন। এটি এখন in-app task list; push/email notification নয়।</p>
          <form onSubmit={addTask} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">কোন গাছ?
              <select required value={taskPlantId} onChange={(e) => setTaskPlantId(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base" disabled={!plants.length}>
                {plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.nickname || plant.plant_name}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">কাজের ধরন
              <select value={taskType} onChange={(e) => { setTaskType(e.target.value); setTaskTitle(taskTypes.find(([v]) => v === e.target.value)?.[1] ?? "গাছের যত্ন"); }} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base">
                {taskTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">কবে করবেন?
              <input required type="date" min={today} value={dueOn} onChange={(e) => setDueOn(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base" />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">কাজের নাম
              <input required minLength={2} maxLength={160} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-base" />
            </label>
            <button disabled={saving || !plants.length} className="min-h-12 rounded-xl border border-emerald-800 px-5 py-3 font-bold text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-50 sm:col-span-2">Care task সংরক্ষণ করুন</button>
          </form>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-900 p-5 text-white"><p className="text-sm text-emerald-100">আমার গাছ</p><p className="mt-2 text-3xl font-black">{plants.length}</p></div>
          <div className="rounded-2xl bg-lime-100 p-5 text-emerald-950"><p className="text-sm">অসম্পন্ন কাজ</p><p className="mt-2 text-3xl font-black">{openTasks.length}</p></div>
        </div>
        {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-950">{notice}</p>}
        <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">আমার গাছের তালিকা</h2><span className="text-xs text-slate-500">{loading ? "লোড হচ্ছে…" : "আপডেটেড"}</span></div>
          <div className="mt-4 space-y-3">
            {!loading && !plants.length && <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">এখনো কোনো গাছ যোগ করেননি। বাম পাশের ফর্ম দিয়ে শুরু করুন।</p>}
            {plants.map((plant) => <article key={plant.id} className="rounded-xl border border-slate-100 p-4"><div className="flex gap-3"><span aria-hidden="true" className="text-2xl">🪴</span><div className="min-w-0"><h3 className="font-bold">{plant.nickname || plant.plant_name}</h3>{plant.nickname && <p className="text-sm text-slate-500">{plant.plant_name}</p>}<p className="mt-1 text-sm text-slate-600">{plantTypes.find(([v]) => v === plant.plant_type)?.[1] || "অন্যান্য"}{plant.location_label ? ` · ${plant.location_label}` : ""}</p></div></div></article>)}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">পরবর্তী যত্নের কাজ</h2>
          <div className="mt-4 space-y-3">
            {!loading && !tasks.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">কোনো care task নেই। গাছ যোগ করে তারিখ নির্ধারণ করুন।</p>}
            {tasks.map((task) => <article key={task.id} className={`rounded-xl border p-4 ${task.completed_at ? "border-slate-100 bg-slate-50" : task.due_on < today ? "border-amber-200 bg-amber-50" : "border-slate-100"}`}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className={`font-bold ${task.completed_at ? "text-slate-500 line-through" : "text-slate-900"}`}>{task.title}</p><p className="mt-1 text-sm text-slate-600">{task.garden_plants?.plant_name || plants.find((p) => p.id === task.plant_id)?.plant_name} · {task.due_on}</p>{task.due_on < today && !task.completed_at && <p className="mt-1 text-xs font-bold text-amber-800">সময় পেরিয়েছে</p>}</div>{!task.completed_at && <button onClick={() => void completeTask(task.id)} className="min-h-10 shrink-0 rounded-lg border border-emerald-800 px-3 text-sm font-bold text-emerald-900 hover:bg-emerald-50">সম্পন্ন</button>}</div></article>)}
          </div>
        </div>
        <div className="rounded-2xl bg-[#eef6ed] p-5"><h2 className="font-black">আরও সবুজ হতে চান?</h2><div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-emerald-900"><Link href="/ai" className="underline underline-offset-4">Plant Assistant</Link><Link href="/plant-market" className="underline underline-offset-4">Plant Market</Link><Link href="/green-exchange/board" className="underline underline-offset-4">গাছ বিনিময়</Link></div></div>
      </aside>
    </div>
  );
}
