# https://github.com/casey/just
# https://just.systems/

# dev:
#     echo "This will constantly build and copy executable to ~/bin/gg"
#     bun build --watch src/index.ts --target=bun --outfile ~/bin/gg --compile

build:
    bun run build

lint:
    bun run lint

format:
    bun run lint:fix

install:
    bun install

outdated:
    bun outdated

test:
    bun test

release:
    bun run release

upgrade:
    bun update --interactive
    bunx biome migrate --write