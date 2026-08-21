"use server";
import { cookies, headers } from "next/headers";
import { SignInModel } from "../(auth)/_types/auth.types";
import { JWT, UserResponse, UserSession } from "../_types/auth.types";
import { jwtDecode } from "jwt-decode";

export async function signInAction(model: SignInModel) {
  const headersList = headers();
  const userAgent = (await headersList).get("user-agent");
  try {
    const response = await fetch(
      `https://general-api.classbon.com/api/identity/signin`,
      {
        method: "POST",
        body: JSON.stringify({ ...model, userAgent }),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.ok) {
      const user = await response.json();
      await SetAuthCookieAction(user);
      return { isSuccess: true, response: await response.json() };
    }
  } catch {
    return { isSuccess: false };
  }
}

export async function SetAuthCookieAction(user: UserResponse) {
  const decoded = jwtDecode<JWT>(user.accessToken);

  const session: UserSession = {
    username: decoded.username,
    fullName: decoded.fullName,
    pic: decoded.pic,
    exp: decoded.exp * 1000,
    accessToken: user.accessToken,
    sessionId: user.sessionId,
    sessionExpiry: user.sessionExpiry,
  };

  const cookieStore = await cookies();
  cookieStore.set("clb-session", JSON.stringify(session), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
}
