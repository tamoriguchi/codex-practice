# じぶん資産収支帳

個人の資産・収支を一元管理する、ブラウザだけで動く静的MVPです。

## アプリ概要

「じぶん資産収支帳」は、通常の家計簿のように支出額だけを見るのではなく、支出後に手元へ残る価値も一緒に確認するための個人用管理アプリです。

現在のMVPでは、次の機能を実装しています。

- 収支記録の追加・編集・削除
- カテゴリ別の貯金箱型予算UI
- 現物資産の追加・編集・削除
- 定額法による減価償却
- 総資産・純資産・現物資産の残存価値ダッシュボード
- 固定費率、浪費率、自己投資率、資産化率などの分析
- ダークモード / ライトモード
- `localStorage` によるブラウザ内保存

## ファイル構成

```text
codex-practice/
├── index.html
├── styles.css
├── app.js
├── netlify.toml
├── .gitignore
└── README.md
```

このプロジェクトは静的サイトです。`npm install` やビルドコマンドは不要です。

## ローカルでの確認方法

もっとも簡単な確認方法は、ブラウザで `index.html` を開く方法です。

```text
index.html
```

ローカルサーバーで確認したい場合は、プロジェクトフォルダで次を実行します。

```bash
python3 -m http.server 4173
```

その後、ブラウザで次を開きます。

```text
http://127.0.0.1:4173/
```

## GitHubへのアップロード手順

このプロジェクトは `tamoriguchi/codex-practice` に配置する想定です。

初回アップロード、またはローカルで変更を反映する場合は、プロジェクトフォルダで次を実行します。

```bash
git add .
git commit -m "Add static life asset manager"
git push origin main
```

まだリポジトリをクローンしていない場合は、先に次を実行します。

```bash
git clone https://github.com/tamoriguchi/codex-practice.git
cd codex-practice
```

## Netlifyでの無料公開手順

1. [Netlify](https://www.netlify.com/) にログインします。
2. `Add new site` から `Import an existing project` を選びます。
3. GitHubを連携し、`tamoriguchi/codex-practice` リポジトリを選びます。
4. Build settings は次の内容にします。

```text
Build command: 空欄
Publish directory: .
```

5. `Deploy site` を押します。
6. デプロイ完了後、Netlifyの無料URLを開きます。

`netlify.toml` に `publish = "."` を設定しているため、Netlify側で publish directory が自動認識されます。

## 公開後の確認項目

- Netlifyの無料URLでトップ画面が表示される
- `styles.css` が読み込まれ、レイアウトと色が崩れていない
- `app.js` が読み込まれ、ダッシュボードの金額が表示される
- 収支を追加できる
- 追加した収支を編集・削除できる
- 資産を追加できる
- 追加した資産を編集・削除できる
- ページを再読み込みしても入力データが残る
- 別のブラウザやシークレットウィンドウではデータが共有されないことを理解している
- スマホ幅でも横スクロールや文字の重なりがない

## localStorage保存の注意点

現在のMVPはデータベースを使っていません。収支や資産のデータは、利用しているブラウザの `localStorage` に保存されます。

そのため、次の点に注意してください。

- データは端末・ブラウザごとに保存されます。
- スマホとPCの間でデータは同期されません。
- 別ブラウザやシークレットウィンドウでは同じデータを見られません。
- ブラウザのサイトデータを削除すると、保存した収支・資産データも消えます。
- Netlifyに公開しても、他人が自分の `localStorage` データを見られるわけではありません。
- ただし、公開URL自体は誰でもアクセスできるため、本格運用前にログイン機能とデータベースを追加する必要があります。

## 公開前チェックリスト

- [ ] `index.html` がプロジェクト直下にある
- [ ] `styles.css` と `app.js` がプロジェクト直下にある
- [ ] `index.html` から `./styles.css` と `./app.js` を相対パスで読み込んでいる
- [ ] `npm install` やビルドなしでブラウザ表示できる
- [ ] `netlify.toml` の publish directory が `.` になっている
- [ ] `.DS_Store` や `.env` がGitHubに入らない
- [ ] GitHubへ push 済み
- [ ] Netlifyの deploy が成功している
- [ ] 公開URLで表示・追加・編集・削除・再読み込み保存を確認済み

## 将来的な拡張案

- Supabase Auth によるログイン
- PostgreSQLへのデータ保存
- 端末間同期
- レシートOCR
- 銀行・クレジットカード連携
- 中古市場価格を使った資産価値推定
