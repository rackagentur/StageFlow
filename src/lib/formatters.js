export const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
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
