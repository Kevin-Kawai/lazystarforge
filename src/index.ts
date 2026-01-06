#!/usr/bin/env node

import { initializeApp } from "./view/App.ts"

const screen = await initializeApp()
screen.render()
