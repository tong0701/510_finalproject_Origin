import { InterviewSession } from "@/components/interview-session";
import { getPersonForCurrentUser } from "@/lib/data/persons";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ personId: string }> };

export default async function InterviewPage({ params }: Props) {
  const { personId } = await params;
  const person = await getPersonForCurrentUser(personId);
  if (!person) notFound();
  return <InterviewSession person={person} />;
}
