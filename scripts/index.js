'use strict'
{

  const h1 = document.querySelector('h1');
  const buttonConfig = document.querySelector('.button_config');
  const bar1 = document.getElementById('bar1');
  const bar2 = document.getElementById('bar2');
  const bar3 = document.getElementById('bar3');
  const bars = [bar1, bar2, bar3];
  
  const slideMenu = document.querySelector('.slide_menu');
  const smoke = document.getElementById('smoke');
  const closeButton = document.getElementById('close_button');

  const rewardView = document.getElementById('reward');

  const selects = document.querySelectorAll('select');
  const playerSelect = document.getElementById('player_select');
  const leftSelect = document.getElementById('left_select');
  const orderSelect = document.getElementById('order_select');
  
 
  const buttonStart = document.getElementById('button_start');

  const leftSide = document.getElementById('left_side');
  const rightSide = document.getElementById('right_side');
  const answer = document.getElementById('answer');


  const inputButtons = document.querySelectorAll('.input_button');

  const clearReward = document.getElementById('clear_reward');

  const correctMark = document.getElementById('correct_mark');


  //グローバル変数
  let playersAnswer = '';
  let currentPlayer = 'taichi';
  const correctInterval = 300;
  const userName = {
    taichi: '太一',
    satsuki: '彩月',
    yui: '結衣',
    guest: 'ゲスト',
  }
  const userData = {
    //データ構造
    //おこづかい,１の段プレイ可能なら0,２の段…,,
    taichi: [0,0,0,0,0,0,0,0,0,0,],
    satsuki: [0,0,0,0,0,0,0,0,0,0,],
    yui: [0,0,0,0,0,0,0,0,0,0,],
    guest: [0,0,0,0,0,0,0,0,0,0,],
  }
  let order = 'up';
  let intervalID = 0;
  let questionOrder = [];

  //####ここでお小遣いのステップを調整＃＃＃
  const steps = {
    taichi: {up: 4, down: 6, random: 10},
    satsuki: {up: 2, down: 2, random: 6},
    yui: {up: 1, down: 1, random: 2},
    guest: {up: 1, down: 2, random: 5},
  }

  //状態管理
  const Status = {
    standby: 'standby',
    play: 'play',
    cleared: 'cleared',
  }
  let status = Status.standby;



  //イベントリスナー
  buttonConfig.addEventListener(`click`, ()=>{
    if(status === Status.play){
      return;
    }
    slideMenu.classList.add('slide');
    smoke.classList.remove('none');
  });
  closeButton.addEventListener('click', ()=>{
    slideMenu.classList.remove('slide');
    smoke.classList.add('none');
  });
  smoke.addEventListener('click', ()=>{
    slideMenu.classList.remove('slide');
    smoke.classList.add('none');
  });

  playerSelect.addEventListener('change',e=>{
    currentPlayer = e.target.value;
    setStep();
    showReward();
    showClearFlag();
    standbyOrCleared();
    order = 'up';
  });

  leftSelect.addEventListener('change', ()=>{
    standbyOrCleared();
  })

  orderSelect.addEventListener('change', e=>{
    order = e.target.value;
  });

  buttonStart.addEventListener('click',()=>{
    const column = parseInt(leftSelect.value);
    gameStart(column, order);
  });

  inputButtons.forEach(btn=>{
    btn.addEventListener('click',e=>{
      if(e.target.value === 'clear'){
        playersAnswer = '';
        answer.textContent = '';
        return;
      }
      if(answer.textContent === '0'){
        playersAnswer = '';
        answer.textContent = playersAnswer;
      }
      playersAnswer += e.target.value;
      answer.textContent = playersAnswer;
      answerCheck();
    });
  });

  clearReward.addEventListener('click',()=>{
    clearRewardFun();
  });
  

  //ファンクション置き場
  function clearRewardFun(){
    if(window.confirm(`${userName[currentPlayer]}のおこづかいを0円にもどしますか？`)){
      userData[currentPlayer][0] = 0;
      dataSave();
      slideMenu.classList.remove('slide');
      smoke.classList.add('none');
      showReward();
    }
  }

  function statusChange(st){
    status = st;
    switch(st){
      case Status.standby:
        stopAnime();
        bars.forEach(bar=>{
          bar.classList.remove('bar_white');
        });
        selects.forEach(select=>{
          select.disabled = false;
        });
        buttonStart.classList.remove('button_disabled');
        buttonStart.disabled = false;
        inputButtons.forEach(btn=>{
          btn.disabled = true;
          btn.classList.add('button_disabled');
        });      
        break;
      
      case Status.play:
        showAnime();
        bars.forEach(bar=>{
          bar.classList.add('bar_white');
        });
        selects.forEach(select=>{
          select.disabled = true;
        });
        buttonStart.classList.add('button_disabled');
        buttonStart.disabled = true;
        inputButtons.forEach(btn=>{
          btn.disabled = false;
          btn.classList.remove('button_disabled');
        });
        break;

      case Status.cleared:
        stopAnime();
        bars.forEach(bar=>{
          bar.classList.remove('bar_white');
        });
        selects.forEach(select=>{
          select.disabled = false;
        });
        buttonStart.classList.add('button_disabled');
        buttonStart.disabled = true;
        inputButtons.forEach(btn=>{
          btn.disabled = true;
          btn.classList.add('button_disabled');
        });
        break;
    }
  }

 
  function getData(){
    const users = Object.keys(userData);
    users.forEach(user=>{
      const planeData = Cookies.get(user);
      if(planeData){
        const data = planeData.split(',');
        data.pop();//末尾の不要なデータ１つ削除
        const dataInt = [];
        data.forEach( d => {
          dataInt.push(parseInt(d));
        });
        userData[user] = dataInt;
      }
    });

  };
  function showReward(){
    const reward = userData[currentPlayer][0];
    rewardView.textContent = reward;
  };
  
 
  function showClearFlag(){
    const columns = leftSelect.children;
    for(let i = 0; i < columns.length; i++){
      if(userData[currentPlayer][i+1] === 0){
        columns[i].textContent = `${i+1}のだん`;
      } else if(userData[currentPlayer][i+1] === 1){
        columns[i].textContent = `-`;
      }
    }
    
  };
 

  function setStep(){
    const elm = ` <option value="up">のぼり（${steps[currentPlayer].up}円）</option>
    <option value="down">くだり（${steps[currentPlayer].down}円）</option>
    <option value="random">ばら（${steps[currentPlayer].random}円）</option>`;

    while(orderSelect.firstChild){
      orderSelect.removeChild( orderSelect.firstChild );
    }

    orderSelect.insertAdjacentHTML('afterbegin',elm);
  }

  function showAnime(){
    let message = 'お○○○○';
    h1.textContent = message;
    let i = 0;
    const messages = [
      '○こ○○○',
      '○○づ○○',
      '○○○か○',
      '○○○○い',
      'お○○○○'
      ];
    intervalID = setInterval(()=>{
      if(i >= messages.length){
        i = 0;
        message = 'お○○○○';
      }
      message = messages[i];
      h1.textContent = message;
      i++;
    },550);
  }
  function stopAnime(){
    clearInterval(intervalID);
  }
  function standbyOrCleared(){
    if(userData[currentPlayer][parseInt( leftSelect.value)] === 0){
      statusChange(Status.standby);
    } else{
      statusChange(Status.cleared);
    }
  }

  function gameStart(column, order){
    //column:Int order:String
    questionOrder = [];
    switch(order){
      case 'up':
        for(let i = 0; i < 9; i++){
          questionOrder.push(i+1);
        }
        break;
      case 'down':
        for(let i = 0; i < 9; i++){
          questionOrder.unshift(i+1);
        }
        break;
      case 'random':
        while(questionOrder.length < 9){
          const random = Math.floor(Math.random()*9+1);
          if(!questionOrder.includes(random)){
            questionOrder.push(random);
          }
        }
    }
    statusChange(Status.play);
    question(column);
  }

  function question(column){
    playersAnswer = '';
    answer.textContent = '';
    leftSide.textContent = column;
    rightSide.textContent = questionOrder[0];
    questionOrder.shift();
  }



  function answerCheck(){
    const left = parseInt(leftSide.textContent);
    const right = parseInt(rightSide.textContent);
    const playersAnswer = parseInt(answer.textContent);
    const correctAnswer = left * right;
    if(playersAnswer === correctAnswer){
      correct();
    }
  }

  function correct(){
    correctMark.classList.remove('none');
    inputButtons.forEach(btn=>{
      btn.disabled = true;
      btn.classList.add('button_disabled');
    });
    setTimeout(()=>{
      correctMark.classList.add('none');
      inputButtons.forEach(btn=>{
        btn.disabled = false;
        btn.classList.remove('button_disabled');
      });
      if(questionOrder.length === 0){
        gameEnd();
      } else {
        question(leftSelect.value);
      }
    }, correctInterval);
   
  }
  function gameEnd(){
    h1.textContent = 'おこづかいゲット！！';
    h1.classList.add('blinking');
    rewardView.classList.add('blinking');
    //ユーザーデータの更新
    //おこづかい
    userData[currentPlayer][0] += steps[currentPlayer][order];
    //クリアフラグ
    userData[currentPlayer][parseInt(leftSelect.value)] = 1;
    //もしデータ配列に０が一つも無かったら、配列の[1]から[9]を全て０にする
    if(!userData[currentPlayer].includes(0)){
      for(let i = 1; i < 10; i++){
        userData[currentPlayer][i] = 0;
      }
    }

    dataSave();

    //おこづかい、leftselecter,表示更新
    rewardView.textContent = userData[currentPlayer][0];
    showClearFlag();
    setTimeout(()=>{
      h1.textContent = 'おこづかい九九';
      h1.classList.remove('blinking');
      rewardView.classList.remove('blinking');
    },3000);
    statusChange(Status.cleared);
  }

  function dataSave(){
     //cookie書き込み
    //書き込む文字列の作成
    let dataString = '';
    userData[currentPlayer].forEach(dt=>{
      dataString += String(dt);
      dataString += ','
    });
    //書き込み
    Cookies.set(currentPlayer, dataString, {expires: 3});
  }


  function firstAction(){
    getData();
    showReward();
    showClearFlag();
    setStep();
    standbyOrCleared();
  }

  firstAction();
  
}