#!/usr/bin/env node
const taskId = process.env.ETA_APPROVED_TASK_ID;
if (!taskId) {
  console.error("ETA_APPROVED_TASK_ID not set. Eta approval required before npm publish.");
  process.exit(1);
}
console.log(`Eta gate passed: task ${taskId}`);
