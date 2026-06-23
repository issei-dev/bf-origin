// エネミーのステータス定義
let enemyMaxHp = 1000;
let enemyCurrentHp = 1000;

// 画面内の要素（DOM）を取得
const enemyHpBar = document.querySelector('#enemy-1 .hp-bar');
const playerUnits = document.querySelectorAll('.unit');

// 敵にダメージを与える共通関数
function damageEnemy(isBB = false) {
  if (enemyCurrentHp <= 0) return;

  // ダメージ計算（通常は100〜150、BBなら300〜450の大ダメージ）
  const baseDamage = Math.floor(Math.random() * 51) + 100;
  const damage = isBB ? baseDamage * 3 : baseDamage;

  enemyCurrentHp -= damage;
  if (enemyCurrentHp < 0) enemyCurrentHp = 0;

  // 敵のHPバーを更新
  const hpPercentage = (enemyCurrentHp / enemyMaxHp) * 100;
  enemyHpBar.style.width = `${hpPercentage}%`;

  // 画面中央にダメージテキストを簡易表示（コンソールログでも確認用）
  console.log(`${isBB ? '🔥ブレイブバースト！🔥 ' : '通常攻撃：'}${damage} のダメージ！ (残りHP: ${enemyCurrentHp})`);

  if (enemyCurrentHp === 0) {
    setTimeout(() => { alert('ENEMY DEFEATED!!'); }, 300);
  }
}

// 各ユニットに対する操作（タップ・スワイプ）の設定
playerUnits.forEach(unit => {
  // スワイプ判定用の変数
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;
  
  // タップかスワイプかを区別するための判定閾値（ピクセル数）
  const swipeThreshold = 30; 

  // 操作開始（共通処理）
  function handleStart(x, y) {
    startX = x;
    startY = y;
  }

  // 操作終了（共通処理）で方向を判定
  function handleEnd(x, y) {
    endX = x;
    endY = y;

    const diffX = endX - startX;
    const diffY = endY - startY;

    // 移動距離が閾値より小さい場合は「タップ（通常攻撃）」と判定
    if (Math.abs(diffX) < swipeThreshold && Math.abs(diffY) < swipeThreshold) {
      executeNormalAttack(unit);
      return;
    }

    // 縦方向の移動量が横方向より大きい場合、上下スワイプと判定
    if (Math.abs(diffY) > Math.abs(diffX)) {
      if (diffY < -swipeThreshold) {
        // 上スワイプ：ブレイブバースト（BB）
        executeBraveBurst(unit);
      } else if (diffY > swipeThreshold) {
        // 下スワイプ：ガード（防御）
        executeGuard(unit);
      }
    }
  }

  // --- スマホ用（タッチイベント） ---
  unit.addEventListener('touchstart', (e) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  unit.addEventListener('touchend', (e) => {
    handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
  }, { passive: true });

  // --- PC用（マウスイベント） ---
  unit.addEventListener('mousedown', (e) => {
    handleStart(e.clientX, e.clientY);
    
    // マウスを離したときのイベントを1度だけ登録
    const onMouseUp = (me) => {
      handleEnd(me.clientX, me.clientY);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mouseup', onMouseUp);
  });
});

// 1. 通常攻撃の処理
function executeNormalAttack(unit) {
  damageEnemy(false);

  // 前方にピョンと跳ねるアニメーション
  unit.style.transform = 'translateY(-20px)';
  setTimeout(() => { unit.style.transform = 'translateY(0)'; }, 100);
}

// 2. ブレイブバースト（BB）の処理
function executeBraveBurst(unit) {
  // そのユニットのBBゲージ要素を取得
  const bbBar = unit.querySelector('.bb-bar');
  
  // 現在のBBゲージが100%（インラインスタイルが width: 100% ）かチェック
  // ※初期状態では Unit 4 が 100% になっています
  if (bbBar && bbBar.style.width === '100%') {
    
    // BB発動！大ダメージを与える
    damageEnemy(true);

    // BB発動アニメーション：激しく上に飛び出す
    unit.style.transform = 'translateY(-50px) scale(1.2)';
    unit.style.filter = 'brightness(1.5)'; // 一瞬光らせる
    
    // ゲージを消費して0%にする
    bbBar.style.width = '0%';

    setTimeout(() => {
      unit.style.transform = 'translateY(0) scale(1)';
      unit.style.filter = 'none';
    }, 200);

  } else {
    // ゲージが足りない場合は通常攻撃にする、または何もしない（今回は通常攻撃に流します）
    console.log(`${unit.id} のBBゲージが足りません！`);
    executeNormalAttack(unit);
  }
}

// 3. ガード（防御）の処理
function executeGuard(unit) {
  console.log(`${unit.id} は身構えている！`);
  
  // 下方向に少し沈むアニメーション
  unit.style.transform = 'translateY(15px)';
  unit.style.opacity = '0.7'; // 半透明にして防御状態を表現

  // 1秒後に自動で元に戻る（本来はターン終了時まで維持）
  setTimeout(() => {
    unit.style.transform = 'translateY(0)';
    unit.style.opacity = '1';
  }, 1000);
}
