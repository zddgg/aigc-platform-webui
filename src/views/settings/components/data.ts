//导出歌词数据
const dataStr = `
00:00 淘汰 – 陈奕迅 (Eason Chan)
00:08 词：周杰伦
00:17 曲：周杰伦
00:26 编曲：C.Y.Kong
00:35 我说了所有的谎
00:39 你全都相信
00:43 简单的我爱你
00:46 你却老不信
00:51 你书里的剧情
00:55 我不想上演
00:58 因为我喜欢
01:01 喜剧收尾
01:08 我试过完美放弃
01:12 的确很踏实
01:15 醒来了梦散了
01:19 你我都走散了
01:23 情歌的词何必押韵
01:27 就算我是K歌之王
01:31 也不见得把
01:33 爱情唱得完美
01:38 只能说我输了
01:42 也许是你怕了
01:46 我们的回忆没有皱褶
01:51 你却用离开烫下句点
01:54 只能说我认了
01:58 你的不安赢得你信任
02:03 我却得到你安慰的淘汰
02:25 我试过完美放弃
02:29 的确很踏实
02:32 醒来了梦散了
02:36 你我都走散了
02:40 情歌的词何必押韵
02:44 就算我是K歌之王
02:48 也不见得把
02:50 爱情唱得完美
02:55 只能说我输了
02:59 也许是你怕了
03:03 我们的回忆没有皱褶
03:08 你却用离开烫下句点
03:11 只能说我认了
03:15 你的不安赢得你信任
03:21 我却得到你安慰的淘汰
03:44 只能说我输了
03:48 也许是你怕了
03:52 我们的回忆没有皱褶
03:57 你却用离开烫下句点
04:00 只能说我认了
04:04 你的不安赢得你信任
04:09 我却得到你安慰的淘汰`

// 定义歌词数据类型
type Lyric = {
  timestamp: number
  content: string
}

//解析歌词数据
const parseLyrics = (dataStr: string): Lyric[] => {
  const lines = dataStr.split('\n')
  const lyrics: Lyric[] = []

  for (const line of lines) {
    const match = line.match(/(\d{2}):(\d{2}) (.+)/)

    if (match) {
      const [, minutes, seconds, content] = match
      // 将时间戳转换为秒
      const timestamp = parseInt(minutes) * 60 + parseInt(seconds)
      lyrics.push({timestamp, content})
    }
  }

  return lyrics
}
// 使用解析函数获取歌词数组
const lyricsArray: Lyric[] = parseLyrics(dataStr)

//导出
export default lyricsArray