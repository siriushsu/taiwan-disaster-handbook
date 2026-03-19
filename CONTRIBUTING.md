# Contributing | 貢獻指南

Thank you for your interest in contributing to the Taiwan Family Disaster Handbook Generator!

感謝您對台灣家庭防災手冊產生器的貢獻興趣！

## Reporting Data Errors | 回報資料錯誤

If you find incorrect shelter locations, medical facility information, or other data errors:

1. Open an issue using the **Data Correction** template
2. Provide:
   - The type of location (shelter, air-raid shelter, or medical facility)
   - The name and address of the location
   - What information is incorrect
   - The correct information (with a source if possible)

如果您發現避難場所、醫療設施或其他資料有誤，請使用 **Data Correction** 模板建立 Issue，並提供相關資訊。

## Contributing Translations | 貢獻翻譯

This project supports Traditional Chinese and English. To contribute translations:

1. Translation files are located in the `translations/` directory
2. Copy an existing language file as a starting point
3. Translate all strings, preserving the key structure
4. Submit a pull request

本專案支援繁體中文與英文。翻譯檔案位於 `translations/` 目錄中。

## Contributing Code | 貢獻程式碼

### Development Setup | 開發環境設定

```bash
# Clone the repository
git clone https://github.com/<your-username>/taiwan-disaster-handbook.git
cd taiwan-disaster-handbook

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Requirements

- Node.js 18+
- npm 9+

### Code Style

- TypeScript is used throughout the project
- Follow the existing code style and ESLint configuration
- Write meaningful commit messages

## Pull Request Process | PR 流程

1. Fork the repository and create a feature branch from `main`
2. Make your changes in the feature branch
3. Ensure your code passes linting: `npm run lint`
4. Write a clear description of your changes in the PR
5. Link any related issues
6. Wait for review -- maintainers will respond within a few days

### PR Guidelines

- Keep PRs focused on a single change
- Include screenshots for UI changes
- Update translations if you add or change user-facing text
- Test on both desktop and mobile viewports
