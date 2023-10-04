import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { Header } from '../components/Header';
import { url } from '../const';
import './home.scss';

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState('todo'); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== 'undefined') {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };
  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link>
              </p>
            </div>
          </div>
          <ul className="list-tab">
            {lists.map((list, key) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={key}
                  className={`list-tab-item ${isActive ? 'active' : ''}`}
                  tabIndex={0}  // tabキーを押したら選択出来るようにする
                  role="button"  // ロールを設定
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { //tabキーでリストにカーソルを合わせて「Enter」を押すとそのリストの編集ができる
                      handleSelectList(list.id);
                    }
                  }}
                  onClick={() => handleSelectList(list.id)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <Link to="/task/new"  >タスク新規作成</Link>
            </div>
            <div className="display-select-wrapper">
              <select onChange={handleIsDoneDisplayChange} className="display-select">
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks tasks={tasks} selectListId={selectListId} isDoneDisplay={isDoneDisplay} />
          </div>
        </div>
      </main>
    </div>
  );
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  const now = new Date(); //現在時刻を取得

  // 「YYYY-MM-DDTHH:MM:SSZ」形式を「YYYY/MM/DD HH:MM」形式に変換する関数(chatGPTに書かせました)
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString); //オブジェクトに変換
    const year = date.getFullYear(); 
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    //タスクが完了済みの場合は時間だけを表示。未完了の場合は、時間と同時に「※期限が過ぎたタスクです」という注意文を表示
    if( now > date ) 
      return <span>{year}/{month}/{day} {hours}:{minutes}<b className='limit-over'>※期限が過ぎたタスクです</b></span>;

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

// 日時の差から残り日時を計算する関数(chatGPTに書かせました)
const calculateTimeRemaining = (dateTimeString) => {
  const LimitDeadline = new Date(dateTimeString);

  if(now >= LimitDeadline ) return '0日0時間0分'; //返り値の符号に「ー」がつかないように期限が過ぎていたら「０日０時間０分」を返すようにする。

  // ※期限が現在の時間を過ぎている状態で以下の処理を実行すると「now」の値の方が大きくなってしまい、計算結果に「ー」符号がついてしまう。
  const timeRemaining = (LimitDeadline - now) / 1000; //ミリ秒単位なので秒単位に直す

  //「86400」「3600」「60」は、それぞれ一日、一時間、一分の秒数
  const days = Math.floor(timeRemaining / 86400);
  const hours = Math.floor(timeRemaining % 86400 / 3600);
  const minutes = Math.floor(timeRemaining % 3600 / 60);
  return `${days}日 ${hours}時間 ${minutes}分`;
};


  if (tasks === null) return <></>;

  if (isDoneDisplay == 'done') {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;// && task.limit > now.toISOString(); //「完了」かつ期限が過ぎていないタスクだけ表示
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
                {task.title}
                <p>期限：{formatDateTime(task.limit)}</p> 
                <p>残り日時：{calculateTimeRemaining(task.limit)}</p>
                {task.done ? '完了' : '未完了'}
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;// && task.limit > now.toISOString(); //「未完了」かつ期限が過ぎていないタスクだけ表示
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              {task.title}
              <p>期限：{formatDateTime(task.limit)}</p> 
              <p>残り日時：{calculateTimeRemaining(task.limit)}</p>
              {task.done ? '完了' : '未完了'}
            </Link>
          </li>
        ))}
    </ul>
  );
};
