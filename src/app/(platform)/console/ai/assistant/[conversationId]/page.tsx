export const metadata = { title: 'AI Assistant' };

export default async function AIAssistantPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return (
    <div className="p-8">
      <h1 className="text-heading text-2xl text-text-primary mb-2">AI Assistant</h1>
      <p className="text-text-secondary text-sm">Conversation: {conversationId}</p>
    </div>
  );
}
