## 2D图像的大模型工具：

apikey:sk-228da4abae694bcaa2b683e1ef07374e

【接口文档】
https://docs.right.codes/docs/rc_extension/draw

建议用流式的v1/chat/completions接口以防止cloudflare超时

【模型说明】
gpt-image-2-vip
OpenAI最新的画图模型，官方直连，支持分辨率：1K、2K、4K

gpt-image-2
OpenAI最新的画图模型，特价版，支持分辨率：1K

nano-banana
由gemini-2.5-flash-image模型封装而来

nano-banana-2
nano banana第二代绘图模型，综合效果远超上一代，支持分辨率：1K、2K、4K

nano-banana-pro
nano banana第二代绘图模型，综合效果远超上一代，支持分辨率：1K、2K、4K

## 3D模型生成能力大模型

apikey:<OPENAI_COMPATIBLE_API_KEY>

APPID:<TENCENT_CLOUD_APP_ID>

密钥:<TENCENT_CLOUD_SECRET_ID>

混元 OpenAI 兼容接口相关调用示例文档 https://cloud.tencent.com/document/product/1804/126189

base_url：https://api.ai3d.cloud.tencent.com

混元生3D API 兼容了 OpenAI 的接口规范，这意味着您可以在 OpenAI 中使用 cURL 来调用混元大模型。您仅需要将 base_url 和 api_key 替换成混元的相关配置，不需要对应用做额外修改，即可无缝将您的应用切换到混元生3D（专业版）。
base_url：https://api.ai3d.cloud.tencent.com。
api_key：需在控制台 API KEY 页面 进行创建，操作步骤请参见 API Key 管理。
提交生成接口请求地址完整路径：https://api.ai3d.cloud.tencent.com/v1/ai3d/submit。
提交查询接口请求地址完整路径：https://api.ai3d.cloud.tencent.com/v1/ai3d/query。
混元生3D（专业版）
目前接口仅支持混元生3D（专业版），您可通过输入图片或文本，输出完整的3D 模型，详情请参见 提交混元生3D 专业版任务 。
【Model】为混元生3D 模型版本，可选值：3.0，3.1，选择3.1版本时，LowPoly，Sketch 参数不可用，默认为3.0。
ImageUrl.Url 支持图片链接和图片 base64两种方式。其中图片 base64的格式为："data:image/jpeg;base64,xxxxxxx"（注意：data:image/jpeg;base64之后的逗号需使用英文逗号）。
提交3D 生成任务，示例如下：

curl --location 'https://api.ai3d.cloud.tencent.com/v1/ai3d/submit' \
--header 'Authorization: sk-A**\*\*\***ZZZ' \
--header 'Content-Type: application/json' \
--data '{
"Prompt":" 小狗"
}'

获取 JobID 后，可使用 JobID 查询对应生成任务，示例如下：
curl --location 'https://api.ai3d.cloud.tencent.com/v1/ai3d/query' \
--header 'Authorization: sk-A**\*\***ZZZ' \
--header 'Content-Type: application/json' \
--data '{
"JobId":"1387416933258346496"
}'

//提交示例
curl -X POST 'https://tokenhub.tencentmaas.com/v1/api/3d/submit' \
 -H 'Authorization: Bearer sk-F9AGW2A4HtiOSRE8jZONxXeBtKP7fv1lpnuKfs84dXDYJlNW' \
 -H 'Content-Type: application/json' \
 -d '{
"model": "hy-3d-3.0",
"prompt": "一只小狗"
}'

//查询示例
curl -X POST 'https://tokenhub.tencentmaas.com/v1/api/3d/query' \
 -H 'Authorization: Bearer sk-F9AGW2A4HtiOSRE8jZONxXeBtKP7fv1lpnuKfs84dXDYJlNW' \
 -H 'Content-Type: application/json' \
 -d '{
"model": "hy-3d-3.0",
"id": "xxxxxx"
}'
