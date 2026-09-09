# the emit live 2026.10.02

イベント告知と参加登録のための静的サイトです。登録内容は Google Apps Script 経由で Google スプレッドシートに保存できます。

公開サイト: https://kaitofl.github.io/the-emit-live-1002/

## 現在の接続

womomoアカウントのApps Scriptをウェブアプリとして公開し、`index.html` に接続済みです。保存先のスプレッドシートは非公開です。

2026/09/10に、Googleへログインしていないブラウザから「行けそう・2人」を送信し、続いて同じ名前で「行けなくなった・0人」に更新できることをシートと画面の両方で確認しました。識別用の「接続テスト 20260910（参加者ではありません）」行は0人で残しています。

## Google スプレッドシート連携

1. womomoのGoogleアカウントで [本イベント用のApps Script](https://script.google.com/home/projects/1eKUwzP2RdAUzVbfXTYtQ1Pv8Nh_3UeAh5vgJLKnL-8XWwVk_sbIYG_ZO/edit) を開きます。
2. 初めて設定する場合は、プロジェクトに `google-apps-script/Code.gs` を保存します。現在のプロジェクトには保存済みです。
3. 関数一覧で `setup` を選び、実行します。初回は Google の権限承認が必要です。
4. [womomo側の登録先シート](https://docs.google.com/spreadsheets/d/1gyRIkn6_vIDuC0xjc_DokAnLUQbogbT9FJzn9meGbUY/edit) に「参加予定」タブが準備され、実行ログにリンクが表示されます。ID はスクリプトプロパティに保存されます。`setup` を再実行しても同じシートを使います。
5. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」を選びます。「次のユーザーとして実行」は自分、「アクセスできるユーザー」は全員にします。シートそのものは非公開のままにします。
6. ウェブアプリ URL（末尾が `/exec`）を `index.html` の `RSVP_ENDPOINT` に設定します。

```js
const RSVP_ENDPOINT = "https://script.google.com/macros/s/...../exec";
```

既存のシートを使う場合は、`setup` 実行前にスクリプトプロパティ `SPREADSHEET_ID` にそのIDを設定します。既存の他のタブは変更しません。

## 登録・変更の扱い

- メールアドレスは収集しません。「名前・ニックネーム」「人数」「参加予定（行けそう／行けなくなった）」を保存します。
- 同じ名前（前後空白除去・全角半角を正規化）で再送信すると、同じ行が最新の予定に更新されます。同名の別人は区別できないため、主催者が識別できる名前を使ってください。本人認証はありません。
- 「行けなくなった」は人数0で記録し、名前と変更日時を残します。一部の同行者だけが来られなくなった場合は「行けそう」のまま人数を変更します。
- 保存先の「参加予定」タブは、更新日時／名前・ニックネーム／人数／参加予定／イベントの5列です。人数列の合計が現在の参加予定人数です。
- 成功応答を読み取れた場合だけ完了表示します。通信エラーやタイムアウト時は入力を保持します。同じ名前で再送しても行は増えません。
- 公開URLへのGETは疎通確認用のイベント名とバージョンだけを返します。参加者一覧を返すAPIはありません。
- コード変更後は「デプロイを管理」で新しいバージョンへ更新してください。

## 接続後の確認

1. 公開URLを開き、`ok: true`、`version: 2` が返ることを確認します。
2. サイトから識別用のテスト名で「行けそう」2人を送信し、シートに2人と記録されることを確認します。
3. 同じ名前で「行けなくなった」を送信し、同じ行が0人に更新されることを確認します。再送しても行が増えないことも確認します。
4. スマートフォン／ログアウト状態でも成功応答を受信できることを確認してから公開します。

Apps Script のJSON応答はリダイレクトされます。ブラウザからの読み取りが公開設定や環境の影響で失敗する場合は、同一オリジンの中継API等を追加して確認します。`no-cors` で成功扱いにしないでください。

参考: [Google公式 Web Apps](https://developers.google.com/apps-script/guides/web)、[Content Service](https://developers.google.com/apps-script/guides/content)、[Lock Service](https://developers.google.com/apps-script/reference/lock/lock-service)。

## ローカル確認

```sh
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。現在のフォームは実際のGoogle Sheetsに送信されるため、動作確認では識別できるテスト名を使ってください。
