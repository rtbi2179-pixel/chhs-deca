# Native Roleplay Simulator Validation Notes

## Browser render check

On 2026-08-21, the `/ai/roleplay` route rendered the native Blue Blazer privacy guard in a signed-out browser session. The route showed the expected “Sign in to enter the simulator” account-bound message and did not load the prior external roleplay application or an iframe.

Authenticated workflow, microphone permission, recording, transcription, and scoring still require a signed-in account and a device microphone to test end to end.
