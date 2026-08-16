export type VoiceCallbacks = {
  onListening: (sessionId: string, partial: string) => void
  onDraft: (sessionId: string, text: string) => void
  onCancel: (sessionId: string) => void
  onError: (sessionId: string, message: string) => void
}

export class VoiceCommandGate {
  private lockedId: string | null = null
  private draft: string = ""
  private callbacks: VoiceCallbacks
  private asr: AsrModule | null = null
  private asrReady: boolean = false

  constructor(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks
    try {
      this.asr = require("LensStudio:AsrModule") as AsrModule
      this.asrReady = true
    } catch (err) {
      this.asrReady = false
    }
  }

  public isLocked(sessionId: string): boolean {
    return this.lockedId === sessionId
  }

  public lockedSession(): string | null {
    return this.lockedId
  }

  public lockAndListen(sessionId: string): void {
    this.lockedId = sessionId
    this.draft = ""
    this.callbacks.onListening(sessionId, "")
    if (!this.asrReady || !this.asr) {
      return
    }
    const options = AsrModule.AsrTranscriptionOptions.create()
    options.silenceUntilTerminationMs = 1000
    options.mode = AsrModule.AsrMode.HighAccuracy
    options.onTranscriptionUpdateEvent.add((event: AsrModule.TranscriptionUpdateEvent) => {
      if (this.lockedId !== sessionId) {
        return
      }
      this.draft = event.text
      this.callbacks.onListening(sessionId, event.text)
      if (event.isFinal) {
        this.callbacks.onDraft(sessionId, event.text)
      }
    })
    options.onTranscriptionErrorEvent.add(() => {
      this.callbacks.onError(sessionId, "ASR error")
      this.clear()
    })
    this.asr.startTranscribing(options)
  }

  public setDraft(text: string): void {
    this.draft = text
    if (this.lockedId) {
      this.callbacks.onDraft(this.lockedId, text)
    }
  }

  public takeDraft(): string {
    return this.draft
  }

  public cancel(): void {
    const id = this.lockedId
    this.stopAsr()
    this.lockedId = null
    this.draft = ""
    if (id) {
      this.callbacks.onCancel(id)
    }
  }

  public clear(): void {
    this.stopAsr()
    this.lockedId = null
    this.draft = ""
  }

  private stopAsr(): void {
    if (this.asrReady && this.asr) {
      try {
        this.asr.stopTranscribing()
      } catch (err) {
        // Preview may not have an active session
      }
    }
  }
}
