export const formatShortDate = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const formatFollowUpLabel = (stage) => {
  if (stage === "contacted") return "1st follow-up";
  if (stage === "followup1") return "2nd follow-up";
  if (stage === "followup2") return "Final follow-up";
  return "Follow-up";
};
