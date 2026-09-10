# the emit live 2026.10.02

イベント告知と参加登録のための静的サイトです。登録内容は Google Apps Script 経由で Google スプレッドシートに保存できます。

公開サイト: https://kaitofl.github.io/the-emit-live-1002/

## 現在の接続

womomoアカウントのApps Scriptをウェブアプリとして公開し、`index.html` に接続済みです。保存先のスプレッドシートは非公開です。

送信ごとに末尾へ1行ずつ追加する方式です。同名の回答も上書き・統合しません。

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

## 回答の保存

- メールアドレスは収集しません。「名前・ニックネーム」「人数」「参加予定（行けそう／行けなくなった）」を保存します。
- 同じ名前でも毎回新しい行を追加します。過去の回答は変更しません。
- 「行けなくなった」は人数0で新しい行に記録します。
- 保存先の「参加予定」タブは、受付日時／名前・ニックネーム／人数／参加予定／イベントの5列です。回答履歴のため、人数列の単純合計は現在の参加人数にはなりません。
- 成功応答を読み取れた場合だけ完了表示します。通信エラーやタイムアウト時は入力を保持します。再送すると別の回答行として追加されるため、保存が不明な場合は主催者への確認を案内します。
- 公開URLへのGETは疎通確認用のイベント名とバージョンだけを返します。参加者一覧を返すAPIはありません。
- コード変更後は「デプロイを管理」で新しいバージョンへ更新してください。

## 接続後の確認

1. 公開URLを開き、`ok: true`、`version: 3` が返ることを確認します。
2. サイトから識別用のテスト名で「行けそう」2人を送信し、シートに2人と記録されることを確認します。
3. 同じ名前で「行けなくなった」を送信し、前の行を変更せず、新しい行に0人として追加されることを確認します。
4. スマートフォン／ログアウト状態でも成功応答を受信できることを確認してから公開します。

Apps Script のJSON応答はリダイレクトされます。ブラウザからの読み取りが公開設定や環境の影響で失敗する場合は、同一オリジンの中継API等を追加して確認します。`no-cors` で成功扱いにしないでください。

参考: [Google公式 Web Apps](https://developers.google.com/apps-script/guides/web)、[Content Service](https://developers.google.com/apps-script/guides/content)、[Lock Service](https://developers.google.com/apps-script/reference/lock/lock-service)。

## ローカル確認

```sh
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。現在のフォームは実際のGoogle Sheetsに送信されるため、動作確認では識別できるテスト名を使ってください。
