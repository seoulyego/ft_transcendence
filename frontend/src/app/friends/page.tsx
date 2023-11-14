"use client";

import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNotification } from "@/contexts/NotificationContext";

export default function Friends() {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [name, setName] = useState<string>("");
  const {
    registerNotificationEventHandler,
    unregisterNotificationEventHandler,
  } = useNotification();

  type User = {
    id: number;
    name: string;
    status: string;
  };

  type FriendRequest = {
    id: number;
    sender_id: number;
    userData: User;
  };

  const fetchFriends = () => {
    const access_token = Cookies.get("access_token");
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((response) => {
        const data = response.data;

        const fetchUserInfosPromises = data.map((friendData: any) => {
          return axios
            .get(
              `${process.env.NEXT_PUBLIC_API_URL}/users/id/${friendData.friend_id}`,
              {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                },
              }
            )
            .then((userInfoResponse) => userInfoResponse.data);
        });

        return Promise.all(fetchUserInfosPromises);
      })
      .then((usersData) => {
        setFriends(usersData);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const fetchFriendRequests = () => {
    const access_token = Cookies.get("access_token");

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/friends/requests`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then((response) => {
        const requests = response.data;

        const fetchUserInfosPromises = requests.map(
          (request: FriendRequest) => {
            return axios
              .get(
                `${process.env.NEXT_PUBLIC_API_URL}/users/id/${request.sender_id}`,
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              )
              .then((userInfoResponse) => {
                return {
                  id: request.id,
                  userData: userInfoResponse.data,
                };
              });
          }
        );

        return Promise.all(fetchUserInfosPromises);
      })
      .then((usersDataWithIds) => {
        setFriendRequests(usersDataWithIds);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    const handleNotification = (message: any) => {
      if (
        message.type == "REQUESTED_FRIEND" ||
        message.type == "DELETED_FRIEND" ||
        message.type == "ACCEPTED_YOUR_REQ" ||
        message.type == "DECLINED_YOUR_REQ" ||
        message.type == "ADDED_TO_CHANNEL"
      ) {
        fetchFriends();
        fetchFriendRequests();
      }
    };

    registerNotificationEventHandler(handleNotification);

    return () => {
      unregisterNotificationEventHandler(handleNotification);
    };
  }, [registerNotificationEventHandler, unregisterNotificationEventHandler]);

  const handleFriendRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const access_token = Cookies.get("access_token");

    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/add?name=${name}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then((response) => {
        toast.success("친구 요청을 보냈습니다.");
      })
      .catch((error) => {
        console.error(error);
        toast.error((error.response?.data as { message: string })?.message);
      });
  };

  const handleFriendRequestAccept = (requestId: number) => {
    const access_token = Cookies.get("access_token");

    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/request/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then((response) => {
        toast.success("친구 요청을 승락했습니다.");
        fetchFriendRequests();
        fetchFriends();
      })
      .catch((error) => {
        console.error(error);
        toast.error((error.response?.data as { message: string })?.message);
      });
  };

  const handleFriendRequestReject = (requestId: number) => {
    const access_token = Cookies.get("access_token");

    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/request/${requestId}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then((response) => {
        toast.success("친구 요청을 거절했습니다.");
        fetchFriendRequests();
      })
      .catch((error) => {
        console.error(error);
        toast.error((error.response?.data as { message: string })?.message);
      });
  };

  const handleFriendDelete = (name: string) => {
    const access_token = Cookies.get("access_token");

    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/friends/delete/?name=${name}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then((response) => {
        toast.success("친구를 삭제했습니다.");
        fetchFriends();
      })
      .catch((error) => {
        console.error(error);
        toast.error((error.response?.data as { message: string })?.message);
      });
  };

  const handleCreateDM = (friendId: number) => {
    const access_token = Cookies.get("access_token");

    axios
      .post(
        `${process.env.NEXT_PUBLIC_API_URL}/channels/create/${friendId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
      .then((response) => {
        toast.success("DM을 만들었습니다.");
      })
      .catch((error) => {
        console.error(error);
        toast.error((error.response?.data as { message: string })?.message);
      });
  };

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  return (
    <div className="friend-menu-container">
      <h2>친구 목록</h2>
      <ul>
        {friends &&
          friends.length > 0 &&
          friends.map((friend) => (
            <li className="friend-menu-container-elem" key={friend.name}>
              <a href={`/profile/${friend.name}`}>
                [{friend.status}] {friend.name}
              </a>
              <button onClick={() => handleCreateDM(friend.id)}>
                채팅 만들기
              </button>
              <button onClick={() => handleFriendDelete(friend.name)}>
                친구 삭제
              </button>
              {friend.status != "in_game" && (
                <button>
                  <a href={`/game?userId=${friend.id}`}>게임 초대</a>
                </button>
              )}
              {friend.status == "in_game" && (
                <button>
                  <a href={`/game?spectateUserId=${friend.id}`}>게임 관전</a>
                </button>
              )}
            </li>
          ))}
      </ul>
      <h2>친구 요청 목록</h2>
      <ul>
        {friendRequests &&
          friendRequests.length > 0 &&
          friendRequests.map((friendRequest) => (
            <li key={friendRequest.userData.name}>
              <span>{friendRequest.userData.name}</span>
              <button
                onClick={() => handleFriendRequestAccept(friendRequest.id)}
              >
                수락
              </button>
              <button
                onClick={() => handleFriendRequestReject(friendRequest.id)}
              >
                거절
              </button>
            </li>
          ))}
      </ul>
      <h2>친구 요청</h2>
      <div className="form-container">
        <form onSubmit={handleFriendRequest}>
          <label htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name"
          />
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}
