import { IconButton, IconButtonProps, useColorMode, useColorModeValue } from "@chakra-ui/react"
import { Moon, Sun } from "lucide-react"
import * as React from "react"

type ColorModeSwitcherProps = Omit<IconButtonProps, "aria-label">

/** Header theme toggle — icon only, no text label needed. */
export const ColorModeSwitcher: React.FC<ColorModeSwitcherProps> = (props) => {
  const { toggleColorMode } = useColorMode()
  const label = useColorModeValue("Switch to dark mode", "Switch to light mode")
  const SwitchIcon = useColorModeValue(Moon, Sun)

  return (
    <IconButton
      size="sm"
      variant="ghost"
      onClick={toggleColorMode}
      icon={<SwitchIcon size={20} />}
      aria-label={label}
      title={label}
      {...props}
    />
  )
}
