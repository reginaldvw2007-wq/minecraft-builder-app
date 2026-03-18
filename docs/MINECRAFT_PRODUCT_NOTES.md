# Minecraft Product Notes

## Why the app is mobile-first

The near-term product target is Bedrock-style building from a phone workflow: scout a
real structure, upload a few photos, and carry a compact block plan back into Minecraft
without needing a desktop-heavy interface.

## Official Minecraft cues we are using

- Bedrock release notes explicitly call out touch-control work on iOS and Android, which
  supports treating touch-first play as a real product constraint rather than a side path:
  [Minecraft - Trails & Tales - 1.20.0 (Bedrock)](https://feedback.minecraft.net/hc/en-us/articles/16421714461453-Minecraft-Trails-Tales-1-20-0-Bedrock)
- The same official Bedrock changelog introduced Cherry Groves, Cherry wood, and Bamboo
  Mosaic, which are now core style references for warm and lightweight build kits:
  [Minecraft - Trails & Tales - 1.20.0 (Bedrock)](https://feedback.minecraft.net/hc/en-us/articles/16421714461453-Minecraft-Trails-Tales-1-20-0-Bedrock)
- Mojang’s official Bedrock preview notes describe Trial Chambers as structures built from
  Copper and Tuff blocks, which is why the app now leans into tuff/copper industrial kits:
  [Minecraft Beta & Preview - 1.20.60.20](https://feedback.minecraft.net/hc/en-us/articles/21354522496525-Minecraft-Beta-Preview-1-20-60-20)
- Mojang’s official preview notes for the Garden Awakens content introduced the Pale
  Garden biome, Pale Oak tree, and Pale Moss set, which gives us a second modern moody
  palette family for exploration builds:
  [Minecraft Preview 1.21.50.20](https://www.minecraft.net/ru-ru/article/minecraft-preview-1-21-50-20)

## Product implications

- mobile sessions should support short, interruptible building loops
- stack counts and hotbar ordering should be visible without scrolling deep into the UI
- narrow-screen layer slices should stay legible before any advanced export exists
- theme names should feel like real Minecraft kits, not generic architecture labels
- exports should carry biome, block-family, and playstyle context alongside dimensions
