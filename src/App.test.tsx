import React from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import { App } from "./App"

test("renders the clipboard app", async () => {
  render(<App />)

  // Text input now auto-saves — no save button, just the status hint.
  expect(await screen.findByText(/saves automatically/i)).toBeInTheDocument()
  expect(screen.getByText(/save clipboard/i)).toBeInTheDocument()
  // local-only mode: no Supabase credentials in the test env
  expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument()
})

test("typing text auto-saves it to the list", async () => {
  render(<App />)

  await screen.findByText(/saves automatically/i)

  const input = screen.getByPlaceholderText(/type or paste text here/i)
  await userEvent.type(input, "hello rushbin")

  // Auto-save fires ~1.2s after the last keystroke.
  expect(await screen.findByDisplayValue("hello rushbin", {}, { timeout: 8000 })).toBeInTheDocument()
  // Status line confirms the save.
  expect(await screen.findByText(/saved ✓/i, {}, { timeout: 8000 })).toBeInTheDocument()
}, 20000)
