export type IDE =
  | "vscode"
  | "cursor"
  | "phpstorm"
  | "webstorm"
  | "intellij"
  | "sublime"
  | "vim"
  | "neovim"
  | "zed"

export type Theme = "light" | "dark" | "system"

export interface IDEConfig {
  id: IDE
  name: string
  command: string
  installed: boolean
}

export const IDE_CONFIGS: Record<IDE, Omit<IDEConfig, "installed">> = {
  vscode: {
    id: "vscode",
    name: "VS Code",
    command: "code",
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    command: "cursor",
  },
  phpstorm: {
    id: "phpstorm",
    name: "PHPStorm",
    command: "phpstorm",
  },
  webstorm: {
    id: "webstorm",
    name: "WebStorm",
    command: "webstorm",
  },
  intellij: {
    id: "intellij",
    name: "IntelliJ IDEA",
    command: "idea",
  },
  sublime: {
    id: "sublime",
    name: "Sublime Text",
    command: "subl",
  },
  vim: {
    id: "vim",
    name: "Vim",
    command: "vim",
  },
  neovim: {
    id: "neovim",
    name: "Neovim",
    command: "nvim",
  },
  zed: {
    id: "zed",
    name: "Zed",
    command: "zed",
  },
}

export interface Settings {
  defaultIDE: IDE
  theme: Theme
  language: string
}
