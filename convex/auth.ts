import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query } from "./_generated/server";

const LinearProvider = {
  id: "linear", // signIn("my-provider") and will be part of the callback URL
  name: "Linear", // optional, used on the default login page as the button text.
  type: "oauth" as const, // or "oauth" for OAuth 2 providers
  issuer: "https://mcp.linear.app", // to infer the .well-known/openid-configuration URL
  clientId: process.env.LINEAR_CLIENT_ID, // from the provider's dashboard
  clientSecret: process.env.LINEAR_CLIENT_SECRET, // from the provider's dashboard
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous, LinearProvider],
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
