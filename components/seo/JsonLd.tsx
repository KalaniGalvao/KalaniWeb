/**
 * Renders a JSON-LD <script> in the DOM. JSON-LD is Google's preferred
 * structured-data format (decoupled from markup, easy to validate against the
 * Rich Results Test). This is a Server Component, so the data is in the initial
 * HTML — crawlers see it without executing any JavaScript.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Data is author-controlled (static objects), not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
