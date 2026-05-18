"use client";

import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { createBrowserClient } from "@/lib/supabase/browser";
import type { Person } from "@/lib/types/person";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Props = { initialPeople: Person[]; userId: string };
type FormState = { name: string; relationship: string; birthYear: string };

const MAX_PHOTO_MB = 5;

function extFromFile(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export function DashboardManager({ initialPeople, userId }: Props) {
  const { show } = useToast();
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", relationship: "", birthYear: "" });
  const [error, setError] = useState<string | null>(null);
  const [deletingCount, setDeletingCount] = useState(0);

  function openCreate() {
    setEditing({ id: "", user_id: userId, name: "", relationship: "", birth_year: null, photo_url: null, created_at: "" });
    setForm({ name: "", relationship: "", birthYear: "" });
    setPhotoFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  function openEdit(person: Person) {
    setEditing(person);
    setForm({
      name: person.name,
      relationship: person.relationship ?? "",
      birthYear: person.birth_year ? String(person.birth_year) : "",
    });
    setPhotoFile(null);
    setPreviewUrl(person.photo_url);
    setError(null);
  }

  function onPickPhoto(file: File | null) {
    if (!file) return;
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setError(`Photo must be <= ${MAX_PHOTO_MB}MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function uploadProfilePhoto(personId: string): Promise<string | null> {
    if (!photoFile) return editing?.photo_url ?? null;
    const supabase = createBrowserClient();
    const path = `${userId}/persons/${personId}.${extFromFile(photoFile)}`;
    const { error: uploadErr } = await supabase.storage.from("photos").upload(path, photoFile, {
      upsert: true,
      contentType: photoFile.type,
    });
    if (uploadErr) throw new Error(uploadErr.message);
    const { data } = supabase.storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function savePerson() {
    if (!editing) return;
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setPending(true);
    setError(null);
    const birth = form.birthYear.trim() ? Number.parseInt(form.birthYear.trim(), 10) : null;
    if (birth != null && (Number.isNaN(birth) || birth < 1800 || birth > 2100)) {
      setError("Birth year must be 1800-2100.");
      setPending(false);
      return;
    }

    const prev = [...people];
    try {
      if (!editing.id) {
        const createRes = await fetch("/api/persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            relationship: form.relationship,
            birth_year: birth,
          }),
        });
        const created = await createRes.json();
        if (!createRes.ok) throw new Error(created.error ?? "Failed to create person");
        const createdPerson = created.person as Person;

        const photoUrl = await uploadProfilePhoto(createdPerson.id);
        if (photoUrl) {
          const patchRes = await fetch(`/api/persons/${createdPerson.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: createdPerson.name,
              relationship: createdPerson.relationship,
              birth_year: createdPerson.birth_year,
              photo_url: photoUrl,
            }),
          });
          const patched = await patchRes.json();
          if (patchRes.ok) {
            setPeople((p) => [patched.person as Person, ...p]);
          } else {
            setPeople((p) => [createdPerson, ...p]);
          }
        } else {
          setPeople((p) => [createdPerson, ...p]);
        }
      } else {
        const optimistic: Person = {
          ...editing,
          name: form.name.trim(),
          relationship: form.relationship.trim(),
          birth_year: birth,
          photo_url: previewUrl,
        };
        setPeople((p) => p.map((x) => (x.id === editing.id ? optimistic : x)));

        const photoUrl = await uploadProfilePhoto(editing.id);
        const res = await fetch(`/api/persons/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: optimistic.name,
            relationship: optimistic.relationship,
            birth_year: optimistic.birth_year,
            photo_url: photoUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to save");
        setPeople((p) => p.map((x) => (x.id === editing.id ? (data.person as Person) : x)));
      }
      setEditing(null);
      setPhotoFile(null);
      setPreviewUrl(null);
    } catch (e) {
      setPeople(prev);
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  async function promptDelete(person: Person) {
    setDeleting(person);
    setDeletingCount(0);
    try {
      const res = await fetch(`/api/persons/${person.id}`);
      const data = await res.json();
      if (res.ok) setDeletingCount(data.storyCount ?? 0);
    } catch {
      setDeletingCount(0);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const snapshot = [...people];
    const person = deleting;
    setPeople((p) => p.filter((x) => x.id !== person.id));
    setDeleting(null);
    setPending(true);
    try {
      const res = await fetch(`/api/persons/${person.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      show(`${person.name.split(" ")[0]}'s stories have been removed.`);
    } catch {
      setPeople(snapshot);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-9">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="ai-question mb-2">Your people</p>
          <h2 className="display text-[32px] text-[var(--origins-ink)]">Whose stories will you keep?</h2>
        </div>
        <button type="button" className="btn-primary shrink-0" onClick={openCreate}>
          + Add someone
        </button>
      </div>

      <ul className="grid gap-9 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p, idx) => (
          <li key={p.id} className="group relative">
            <div className="absolute right-0 top-0 z-10">
              <button type="button" className="btn-ghost !px-2 !py-1" aria-label="More actions" onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}>
                ⋯
              </button>
              {openMenu === p.id ? (
                <div className="absolute right-0 mt-1 w-44 rounded-md border border-[var(--origins-edge)] bg-[var(--origins-paper)] p-1 shadow-sm">
                  <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--origins-paper-deep)]" onClick={() => { setOpenMenu(null); openEdit(p); }}>
                    Edit profile
                  </button>
                  <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-[var(--origins-rose)] hover:bg-[var(--origins-paper-deep)]" onClick={() => { setOpenMenu(null); void promptDelete(p); }}>
                    Delete everything
                  </button>
                </div>
              ) : null}
            </div>

            <div className={`photo photo-rotate-${(idx % 3) + 1} mb-3.5 block w-full`}>
              <div className="photo-inner relative min-h-[220px] w-full overflow-hidden">
                {p.photo_url ? (
                  <Image
                    src={p.photo_url}
                    alt={`${p.name} portrait`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <button
                    type="button"
                    className="flex h-full min-h-[220px] w-full items-center justify-center text-sm text-[var(--origins-ink-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => openEdit(p)}
                  >
                    + Add photo
                  </button>
                )}
              </div>
            </div>

            <h3 className="display text-xl text-[var(--origins-ink)]">{p.name}</h3>
            {(p.relationship || p.birth_year) ? (
              <p className="font-serif text-sm italic text-[var(--origins-ink-soft)]">
                {[p.relationship, p.birth_year ? `b. ${p.birth_year}` : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/interview/${p.id}`} className="btn-primary !px-4 !py-2 !text-xs">
                Interview
              </Link>
              <Link href={`/timeline/${p.id}`} className="btn-secondary !px-4 !py-2 !text-xs">
                Timeline
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Dialog
        open={Boolean(editing)}
        title={editing?.id ? "Edit profile" : "Add someone"}
        onClose={() => !pending && setEditing(null)}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)} disabled={pending}>
              Cancel
            </button>
            <button className="btn-primary disabled:opacity-60" onClick={savePerson} disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        {error ? <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900">{error}</p> : null}
        <div className="space-y-3">
          <input className="field-input" placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="field-input" placeholder="Relationship" value={form.relationship} onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))} />
          <input className="field-input" placeholder="Birth year" value={form.birthYear} onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))} />
          <label
            className="block rounded-xl border border-dashed border-[var(--origins-edge)] bg-[var(--origins-paper-deep)] p-4 text-sm text-[var(--origins-ink-soft)]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPickPhoto(e.dataTransfer.files[0] ?? null);
            }}
          >
            Drag photo here or click to choose (max 5MB)
            <input type="file" accept="image/*" className="mt-2 block" onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)} />
          </label>
          {previewUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--origins-edge)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? "profile"}?`}
        onClose={() => !pending && setDeleting(null)}
        actions={
          <>
            <button className="btn-ghost" onClick={() => setDeleting(null)} disabled={pending}>
              Cancel
            </button>
            <button
              className="rounded-full bg-[var(--origins-rose)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={confirmDelete}
              disabled={pending}
            >
              Delete everything
            </button>
          </>
        }
      >
        This will permanently remove this profile and all {deletingCount} captured stories.
        This cannot be undone.
      </Dialog>
    </div>
  );
}
