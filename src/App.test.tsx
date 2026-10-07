import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import { App } from "./App"

test("renders the clipboard app", async () => {
  render(<App />)

  // Text input auto-saves on blur — no save button, just the hint.
  expect(await screen.findByText(/type anything/i)).toBeInTheDocument()
  expect(screen.getByRole("button", { name: /save clipboard/i })).toBeInTheDocument()
  // local-only mode: no Supabase credentials in the test env
  expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument()
})

test("typing text saves it to the list on blur", async () => {
  render(<App />)

  await screen.findByText(/type anything/i)

  const input = screen.getByPlaceholderText(/type anything to save/i)
  await userEvent.type(input, "hello rushbin")
  // Tapping away commits the note — typing is never cut off mid-thought.
  fireEvent.blur(input)

  expect(await screen.findByDisplayValue("hello rushbin", {}, { timeout: 8000 })).toBeInTheDocument()
  // Status line confirms the save.
  expect(await screen.findByText(/saved ✓/i, {}, { timeout: 8000 })).toBeInTheDocument()
}, 20000)
