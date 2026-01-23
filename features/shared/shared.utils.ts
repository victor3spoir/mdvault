
export function formatDate(date:Date){
  return date.toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}
