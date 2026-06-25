type CommentNotificationPayload = {
  event: "azgallery.comment.created";
  comment: {
    id: string;
    text: string;
    visitor_name: string;
    visitor_phone: string | null;
    position_x: number | null;
    position_y: number | null;
    created_at: string;
  };
  project: {
    id: string;
    slug: string;
    name: string;
    url: string;
  };
  image: {
    id: string;
    url: string;
    caption: string | null;
  };
};

function getBaseUrl() {
  return process.env.AZGALLERY_PUBLIC_BASE_URL || "https://photos.alazab.com";
}

export async function notifyCommentCreated(payload: Omit<CommentNotificationPayload, "event">) {
  const webhookUrl = process.env.AZGALLERY_COMMENT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info("[AzGallery] AZGALLERY_COMMENT_WEBHOOK_URL is not configured; comment notification skipped.");
    return;
  }

  const body: CommentNotificationPayload = {
    event: "azgallery.comment.created",
    ...payload,
    project: {
      ...payload.project,
      url: `${getBaseUrl().replace(/\/$/, "")}/project/${payload.project.slug}`,
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AZGALLERY_COMMENT_WEBHOOK_TOKEN
          ? { authorization: `Bearer ${process.env.AZGALLERY_COMMENT_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`[AzGallery] Comment notification failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error("[AzGallery] Comment notification error", error);
  }
}
