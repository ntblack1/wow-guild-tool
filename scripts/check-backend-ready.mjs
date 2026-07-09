const apiBaseUrl = (process.env.API_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

const requestJson = async (path) => {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.success) {
    const message = body?.error?.message || response.statusText || "request failed";
    throw new Error(`${path} failed: ${message}`);
  }

  return body.data;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const main = async () => {
  console.log(`Checking backend at ${apiBaseUrl}`);

  const health = await requestJson("/health");
  assert(health.status === "ok", "health status is not ok");
  assert(health.database === "ok", "database status is not ok");
  console.log("OK /health");

  const events = await requestJson("/events");
  assert(Array.isArray(events), "events response is not a list");
  assert(events.some((event) => event.id === "seed_event_ulduar_25"), "seed event is missing");
  console.log(`OK /events (${events.length} event(s))`);

  const members = await requestJson("/members");
  assert(Array.isArray(members), "members response is not a list");
  assert(members.some((member) => member.id === "seed_member_xiaoheiwa"), "seed member is missing");
  console.log(`OK /members (${members.length} member(s))`);

  const characters = await requestJson("/members/seed_member_xiaoheiwa/characters");
  assert(Array.isArray(characters), "characters response is not a list");
  assert(characters.length > 0, "seed member has no character");
  console.log(`OK /members/seed_member_xiaoheiwa/characters (${characters.length} character(s))`);

  console.log("Backend is ready for miniapp testing.");
};

main().catch((error) => {
  console.error(`Backend readiness check failed: ${error.message}`);
  process.exitCode = 1;
});
