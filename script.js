// エネミーのステータス定義
let enemyMaxHp = 1000;
let enemyCurrentHp = 1000;

// 画面内の要素（DOM）を取得
const enemyHpBar = document.querySelector('#enemy-1 .hp-bar');
const playerUnits = document.querySelectorAll('.unit');

// 敵を攻撃する関数
function attackEnemy() {
  // すでにHPが0の場合は何もしない
  if (enemyCurrentHp <= 0) return;

  // ダメージ計算（100〜150の間のランダムなダメージ）
  const damage = Math.floor(Math.random() * 51) + 100;

  // 敵のHPからダメージを引く（0未満にならないように制御）
  enemyCurrentHp -= damage;
  if (enemyCurrentHp < 0) {
    enemyCurrentHp = 0;
  }

  // 残りHPの割合（パーセンテージ）を計算
  const hpPercentage = (enemyCurrentHp / enemyMaxHp) * 100;

  // CSSの width を書き換えて赤いバーを短くする
  enemyHpBar.style.width = `${hpPercentage}%`;

  // 撃破判定（HPが0になったらアラートを出す）
  if (enemyCurrentHp === 0) {
    setTimeout(() => {
      alert('ENEMY DEFEATED!!');
    }, 300); // ゲージが減り切るアニメーションを少し待ってから表示
  }
}

// 全ての味方ユニットにタップ（クリック）イベントを登録
playerUnits.forEach(unit => {
  unit.addEventListener('click', () => {
    
    // ① 攻撃処理を実行
    attackEnemy();

    // ② 攻撃時の簡単なアニメーション（CSSのtransformで一瞬上に動かす）
    unit.style.transform = 'translateY(-15px)';
    
    // 100ミリ秒後に元の位置に戻す
    setTimeout(() => {
      unit.style.transform = 'translateY(0)';
    }, 100);

  });
});
