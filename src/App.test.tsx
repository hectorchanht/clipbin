import React from "react"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "./test-utils"
import { App } from "./App"

test("renders the clipboard app", async () => {
  render(<App />)

  expect(await screen.findByText(/save text/i)).toBeInTheDocument()
  expect(screen.getByText(/save clipboard/i)).toBeInTheDocument()
  // local-only mode: no Supabase credentials in the test env
  expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument()
})

test("saving text adds it to the list", async () => {
  render(<App />)

  await screen.findByText(/save text/i)

  const input = screen.getByPlaceholderText(/type or paste text here/i)
  await userEvent.type(input, "hello rushbin")
  await userEvent.click(screen.getByRole("button", { name: /save text/i }))

  expect(await screen.findByDisplayValue("hello rushbin")).toBeInTheDocument()
})
