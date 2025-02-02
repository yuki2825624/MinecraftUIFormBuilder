# MinecraftUIFormBuilder

`@minecraft/server-ui`の改良版

# 特徴 / Feature

従来のライブラリの記述方法の違和感を取り除き、直感的にコーディングできるようになります。

### 特に注目するべき点
- 要素の追加の際に、引数の渡し方が連想配列に変更されます。
- 要素の情報を渡す際、`active`を同時に渡せるようになり、その要素を追加するかどうかを設定できるようになります。(例えば、`player.isOp()`を入力すれば、オペレータを持っているプレイヤーにのみに表示させるボタンを追加することが出来ます)
- 要素(ボタン、スライダー等)の追加の際に第二引数に関数を渡せるようにし、決定の際に入力したボタンや内容により処理を分けられる出来るようになります。(これにより、返り値の条件文の記述の必要が無くなり、より直感的にどの要素と処理が紐づいているのかが分かるようになります)
- `ModalFormData`の`dropdown`の返り値であった、「指定した要素のindex」が、「指定した要素そのもの」にすることが出来るようになります。
- `MessageFormData`の`button1`、`button2`が`setAboveButton`、`setBelowButton`に変更され、より直感的に分かるようになります。
- フォームをキャンセルした際の処理を容易に指定できるようになります。

### デメリット
- 要素を指定する際に従来より入力する内容が多くなる為、冗長になりやすくなります。

# 使用例 / Usage

### ActionFormBuilder

- 3個のボタンを追加し、押されたボタンのindexをコンソールに出力する
```js
const form = new ActionFormBuilder("タイトル")
    .addButton({ label: "このボタンのindexは0" })
    .addButton({ label: "このボタンのindexは1" })
    .addButton({ label: "このボタンのindexは2" })
    .onSubmit((selection) => console.log(selection));
form.show(player);
```

- 連番のボタンを10個追加し、何番目のボタンが押されたかを送信する
```js
const form = new ActionFormBuilder("タイトル")
    .setBody("連番のボタン")
    .setCloseButton({ label: "閉じる" });
for (let i = 1; i <= 10; i++) {
    form.addButton({ label: `ボタン${String(i).padStart(2, "0")}` }, (player) => player.sendMessage(`${i}番目のボタンが押されました。`););
}
form.show(player);
```

- キャンセルの原因が`UserBusy`であればフォームを開きなおす
```js
function actionForm(player) {
    const form = new ActionFormBuilder("タイトル")
        .addButton({ label: "もう一度開く" }, actionForm)
        .setCloseButton({ label: "閉じる" })
        .onCancel("UserBusy", () => actionForm(player));
    form.show(player);
}
actionForm(player);
```

### ModalFormBuilder

- 全ての要素を追加し、何の値が入力されたかを送信する
```js
const form = new ModalFormBuilder("果物の評価")
    .addDropdown({ label: "果物", options: ["林檎", "蜜柑", "苺", "葡萄"] }, (fruit, player) => {
        player.sendMessage(fruit);
    })
    .addSlider({ label: "好感度(10点満点)", min: 0, max: 10, step: 1 }, (point, player) => {
        player.sendMessage(`${point}点`);
    })
    .addTextField({ label: "コメント", placeHolder: "コメントを入力してください" }, (comment, player) => {
        player.sendMessage(`コメント: ${comment}`);
    });
    .addToggle({ label: "低評価 / 高評価" }, (liked, player) => {
        player.sendMessage(liked ? "高評価" : "低評価");
    })
    .setSubmitText("決定");
form.show(player);
```

### MessageFormBuilder

- 利用規約を表示させ、もし同意しなければ殺し、もう一度表示させる
```js
function ruleForm(player) {
    const form = new MessageFormBuilder("利用規約")
        .setAboveButton({ label: "同意" }, (player) => player.sendMessage("ありがとうございます！"))
        .setBelowButton({ label: "同意しない" }, (player) => {
            player.kill();
            ruleForm(player);
        })
        .onCancel("UserBusy", () => ruleForm(player))
    form.show(player);
}
ruleForm(player);
```

# ラインセンス / License

これに関する全ての権利を放棄します。
> **UNLICENSED** | <https://unlicense.org>