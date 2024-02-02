## 프로젝트 초기 세팅 시, 설정 했던 히스토리

1. "eslint" vscode extension 설치
2. prettierrc와 eslintrc 적용(추 후 인원이 많아지면 협의하며 수정 필요)
3. jsonc(509) warning 경고 => vscode setting에서 아래 json.schemas 추가

```
    "json.schemas": [
        {
            "fileMatch": [".eslintrc"],
            "schema": {
                "allowTrailingCommas": true
            }
        }
    ]
```

## 프로젝트 실행 SCRIPT 설명

```
  "scripts": {
    "build-sass": "sass src/public/css/main.scss dist/public/css/main.css",
    "build-ts": "tsc",
    "build": "npm run build-sass && npm run build-ts && npm run lint && npm run copy-static-assets",

    "copy-static-assets": "ts-node copyStaticAssets.ts",
    "debug": "npm run build && npm run watch-debug",
    "lint": "tsc --noEmit && eslint \"**/*.{js,ts}\" --quiet --fix",

    "serve-debug": "nodemon --inspect dist/server.js",
    "start": "node dist/server.js",
    "test": "jest --forceExit --coverage --verbose",

    "watch-debug": "concurrently -k -p \"[{name}]\" -n \"Sass,TypeScript,Node\" -c \"yellow.bold,cyan.bold,green.bold\" \"npm run watch-sass\" \"npm run watch-ts\" \"npm run serve-debug\"",
    "watch-node": "nodemon dist/server.js",
    "watch-sass": "sass --watch src/public/css/main.scss dist/public/css/main.css",
    "watch-test": "npm run test -- --watchAll",
    "watch-ts": "tsc -w",
    "watch": "concurrently -k -p \"[{name}]\" -n \"Sass,TypeScript,Node\" -c \"yellow.bold,cyan.bold,green.bold\" \"npm run watch-sass\" \"npm run watch-ts\" \"npm run watch-node\""
  }
```
