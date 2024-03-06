export type User = {
  _id: string;
  displayName: string | undefined;
  userName: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  nickName: string | undefined;
  address: string | undefined;
  birthday: string | undefined;
  email: string;
  phoneNumber?: string | undefined;
  blocked: boolean | undefined;
  avatar: string | undefined;
  bio: string | undefined;
  gender: string | undefined;
};
export type Users = User[];

export type Auth = { user: User };

export type OnlineUsers = OnlineUser[];

export type OnlineUser = {
  userId: string,
  socketId: string,
  status: string,
};
