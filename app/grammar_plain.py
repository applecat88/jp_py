# -*- coding: utf-8 -*-
"""Short English explanations for every grammar pattern, in course order.

One line per pattern. The builder pairs these with the pattern titles.
"""
from __future__ import print_function

import io
import json
import os

LINES = [
    # Day 1
    "は, pronounced wa, names what the sentence is about. です is the polite word for is.",
    "Add か at the end to ask a question. The word order stays the same. Answer with はい, yes, or いいえ, no.",
    "を, pronounced o, marks the thing the action is done to. The polite verb ends in ます.",
    # Day 2
    "これ is by you, それ is by the other person, and あれ is far from both. These words stand alone. They do not come before a noun.",
    "何 means what. Ask 何ですか, and answer by putting the thing in place of 何.",
    "Words such as 新しい, new, and 大きい, big, end in い. Put them before です, or straight before a noun. Do not add な.",
    # Day 3
    "あります is for things. います is for people and animals. に marks the place, and が introduces what is there.",
    "へ, pronounced e, marks where you are going. 行きます means go. 来ます means come.",
    "どこ means where. ここ is here by you, そこ is there by the other person, and あそこ is over there.",
    # Day 4
    "Say the digit, then 十, 百, 千, or 万. A few readings change, such as 三百, sanbyaku, and 八千, hassen. Learn those. Do not guess them.",
    "いくらですか asks how much it is. Answer with the number plus 円.",
    "A counter is the word attached to a number. 個 is for small objects, 人 for people, and 枚 for flat things. Say ファイルが三個, not 三ファイル.",
    # Day 5
    "Put に after a clock time or a weekday, as in 七時に. Do not put に after 今日, 明日, or 毎日.",
    "から is the start. まで is the end. From nine until five is 九時から五時まで.",
    "何時ですか asks the time. 何曜日ですか asks the day of the week.",
    # Day 6
    "この, その, and あの must be followed by a noun: この本, this book. これ, それ, and あれ stand alone.",
    "の links two nouns. Read from the second noun back. 私の本 is my book.",
    "も means also, and it replaces は or が. と between nouns means and. と after a person means with.",
    # Day 7
    "で marks the place where an action happens.",
    "The same で marks the tool or the means: by bicycle, with a pen.",
    "Use に when something is in a place, or when you head toward a place. Use で when you do an action there.",
    # Day 8
    "Change ます to ません to say do not.",
    "Change ます to ました for an action that is finished.",
    "ませんでした means did not. Put the question word where the answer will go: 何を, what, or どこで, where.",
    # Day 9
    "Words such as 毎日, every day, usually sit just before the verb. あまり and ぜんぜん need a negative verb: not much, and not at all.",
    "もう with a past verb means already. まだ with a negative means not yet.",
    "回 counts times. 一回 is once, 二回 is twice, and 何回 asks how many times.",
    # Day 10
    "For an い-adjective, drop the final い. くないです means is not, and かったです means was. いい becomes よ: よくない, よかった.",
    "For a な-adjective, add じゃないです for is not, and でした for was. These words do not end in い, so do not drop one.",
    "とても means very. 少し means a little. An い-adjective sits directly before a noun. A な-adjective needs な before the noun.",
    # Day 11
    "The thing you like or dislike takes が, not を. 日本語が好きです means I like Japanese.",
    "上手, 下手, 得意, and 苦手 also take が. 上手 and 得意 mean you are good at it. 下手 and 苦手 mean you are not.",
    "欲しい means you want a thing. The thing takes が. It changes like an い-adjective: 欲しくないです, 欲しかったです.",
    # Day 12
    "Drop ます and add たいです. 読みます becomes 読みたいです, I want to read. たい then changes like an い-adjective.",
    "ませんか is a friendly invitation: won't you, or shall we.",
    "ましょう means let's. ましょうか means shall I, or shall we.",
    # Day 13
    "For most verbs, the sound before ます decides the て form. 書く becomes 書いて, 読む becomes 読んで, and 話す becomes 話して.",
    "If the verb ends in an え or い sound plus る, drop る and add て. 食べる becomes 食べて, and 見る becomes 見て.",
    "Three verbs do not follow the groups. する becomes して, 来る becomes 来て, and 行く becomes 行って.",
    # Day 14
    "The て form plus ください means please do this.",
    "AてからB means do B only after A is finished.",
    "The ない form plus でください means please don't. 書かないでください is please don't write.",
    # Day 15
    "ています means an action is going on now. 書いています is I am writing.",
    "For some verbs, ています means the result is still true. 知っています means I know, not I am in the middle of knowing.",
    "まだ plus ていません means you have not done it yet.",
    # Day 16
    "The て form plus もいいです means you may.",
    "The て form plus はいけません means you must not. This is a rule.",
    "From the ない form, 書かない becomes 書かなくてもいいです: you don't have to write.",
    # Day 17
    "Put から after a sentence to give a reason: because. どうして and なぜ ask why.",
    "ので also means because, and it sounds softer. It fits requests and reports.",
    "が and けど both mean but. が is a little more formal. けど is what people say. Put them after a polite clause.",
    # Day 18
    "Bより is the thing you compare against. AはBより大きいです means A is bigger than B.",
    "Aのほうが stresses that A is the one. You can leave B out when everyone already knows the comparison.",
    "どちら asks about two things. どれ, or どの plus a noun, asks about three or more. 一番 means the most.",
    # Day 19
    "This is the plain do or does form, the one a dictionary lists. 書く means write. The polite form is 書きます.",
    "The ない form is the plain do not. 書かない means don't write. The polite form is 書きません.",
    "Make the て form, then change て to た and で to だ. 書いて becomes 書いた, wrote.",
    # Day 20
    "Say the thought in the plain form, then と思います. Nouns and な-adjectives need だ before it: 静かだと思います.",
    "と言います quotes someone's words. 言っていました means they said, or they were saying.",
    "The plain form plus かもしれません means might. A noun does not take だ here: 雨かもしれません.",
    # Day 21
    "A plain verb can sit in front of a noun and describe it. 読む本 is a book I read. 読んだ本 is a book I already read.",
    "An い-adjective goes straight before the noun. A な-adjective needs な. A short clause can describe a noun in the same way.",
    "The dictionary form plus こと, or の, turns an action into a thing you can talk about. 泳ぐことが好きです means I like swimming.",
    # Day 22
    "The dictionary form plus とき means when you do it, or when you are about to. The た form plus とき means after it has happened.",
    "前に means before and takes the dictionary form. 後で means after and takes the た form. A noun needs の: 会議の前に.",
    "あいだ is the whole span. あいだに means at some point during that span.",
    # Day 23
    "The dictionary form plus ことができる means can. It works for every verb.",
    "The potential form also means can, built into the verb: 読めます, can read. The thing you can do often takes が instead of を.",
    "見える means something is visible. 聞こえる means something is audible. They are not simply can look and can listen.",
    # Day 24
    "The ます stem plus ながら means while. The verb at the end is the main action. 音楽を聞きながら勉強します means I study while I listen to music.",
    "Use the た form plus り, at least twice, then する. It means things like A and B, not a full list in order.",
    "て joins steps in order. ながら is two actions at the same time. たり gives a few examples of what someone does.",
    # Day 25
    "The dictionary form plus つもりです is your own plan: I intend to. It is not a promise, and it is not a fixed date.",
    "The ない form plus つもりです means I intend not to.",
    "The plain form plus でしょう is a prediction you are willing to say aloud. かもしれません is less sure. つもり is only your own plan.",
    # Day 26
    "The た form plus ら means if or when that happens. 雨が降ったら、行きます means if it rains, I will go.",
    "An い-adjective uses かったら. A な-adjective or a noun uses だったら. いい becomes よかったら.",
    "もし does not add a new rule. It only signals that a condition is coming. 場合 means in the case that, and a noun needs の before it.",
    # Day 27
    "The dictionary form plus と means whenever A happens, B follows. B is a result, not a request and not your decision.",
    "なら means if that is the case. It picks up a situation someone has already mentioned.",
    "The て form plus も means even if. An い-adjective uses くても. A noun uses でも.",
    # Day 28
    "The た form plus ほうがいいです is advice: it would be better to. It is a suggestion, not a rule.",
    "The ない form plus ほうがいいです means it would be better not to.",
    "たらどうですか is a gentle suggestion: why don't you, or how about.",
    # Day 29
    "あげる is giving away from yourself. The giver は, the receiver に, the thing を, then あげます.",
    "くれる is giving toward you, or toward your side. Use it when you are the one who receives.",
    "もらう is receiving. The receiver は, the giver に or から, the thing を, then もらいます.",
    # Day 30
    "てくれますか asks someone to do something for you. It is direct, and still polite.",
    "てもらえますか is the same request, a little softer: could you do this for me.",
    "ていただけますか is the most polite of the three. Use it with a client or someone senior.",
    # Day 31
    "The て form plus みる means try it and see what happens. 食べてみます is I'll try eating it.",
    "The て form plus おく means do it ahead of time, or leave it as it is.",
    "てしまう means finish it completely. With a word such as うっかり, it means do it by accident.",
    # Day 32
    "Drop い and add くなる: 大きくなる, become big. A noun or a な-adjective uses になる. いい becomes よくなる.",
    "くする and にする mean you make it that way. 大きくする is make it big.",
    "ことにする is a decision you make. ことになる is a decision that comes to you, or a result you end up with.",
    # Day 33
    "The dictionary form plus ために means in order to. The same person does both parts, on purpose.",
    "ように means so that a state becomes true, such as being able to do something. The two halves can have different subjects.",
    "A noun plus のために means for the sake of that person or that goal.",
    # Day 34
    "なければならない means must. From 書かない, the polite sentence is 書かなければなりません.",
    "なくてもいい means you don't have to. It is the opposite of must.",
    "The dictionary form plus べきです means ought to. It is stronger than advice and softer than a rule. するべき is also said すべき.",
    # Day 35
    "This そう is what you can see: it looks like, or it looks about to. 降りそうです means it looks like rain. いい becomes よさそう.",
    "The plain form plus そうです means I heard that. A noun needs だ: 雨だそうです.",
    "ようだ is your conclusion from what is in front of you. らしい means it seems, often from what people say or from a general sign.",
    # Day 36
    "The passive says what is done to something. The thing becomes the subject: ファイルが保存されます, the file gets saved.",
    "When the action lands on a person, the doer takes に. It often feels like something was done to you.",
    "The passive plus ています means that state is still true. 保存されています means it is in a saved state.",
    # Day 37
    "The causative means make someone do something, or let them do it. That person takes に.",
    "させてください means please let me do it. This is a polite way to volunteer.",
    "A person plus に, then the て form plus もらう, means have that person do it for you.",
    # Day 38
    "てくる can mean movement toward here, or that something has come up to the present.",
    "ていく can mean movement away from here, or that something will go on from now.",
    "The dictionary form plus ようになる means you reach a new state, often come to be able to. なくなる means no longer, or stop.",
    # Day 39
    "お plus the verb stem plus になります talks about the other person's action, with respect. Do not use it about yourself.",
    "お plus the verb stem plus します humbles your own action when you do it for someone else.",
    "Some polite work lines are best learned whole, such as お世話になっております and よろしくお願いいたします.",
    # Day 40
    "ご before a noun, plus ください, politely asks the other person to do it. ご確認ください means please check.",
    "お plus the verb stem plus ください is the same polite request, built from a verb.",
    "ていただけますと幸いです means I would be glad if you could. It is softer than てください.",
    # Day 41
    "A phrase can describe a file or folder, just as it describes any noun. 昨日作ったフォルダ is the folder I made yesterday.",
    "という means called, or that says. 報告書というファイル is the file called a report.",
    "によって means depending on, or by. 設定によって means depending on the settings.",
    # Day 42
    "In a report, てみました means I tried. It states the attempt, not a guess.",
    "The plain form plus かどうか means whether or not.",
    "A question can sit inside a larger sentence. 何が原因か分かりません means I don't know what the cause is.",
    # Day 43
    "A noun plus をください means I'll take this, or please give me this, when you are buying.",
    "The ます stem plus すぎる means too much. 高すぎます is too expensive. いい becomes よすぎる.",
    "足ります means there is enough. 足りません means there is not enough. The thing takes が.",
    # Day 44
    "The plain form plus んです explains a situation or gives a reason. A noun or a な-adjective needs な: 病気なんです.",
    "Drop い and add くて to join い-adjectives. A noun or a な-adjective uses で. 安くて便利です means cheap and convenient.",
    "The て form plus すみません gives the reason for an apology: I'm sorry that this happened.",
    # Day 45
    "だけ means only. しか also means only, but the verb must be negative. 水しかありません means there is only water.",
    "と lists every item. や means and, among other things. など closes the list with and so on.",
    "ね asks the listener to agree. よ hands over information they may not have. よね checks something you think you both know.",
    # Day 46
    "The ます stem plus 方, read かた, means the way of doing it. 書き方 is how to write. する becomes 仕方.",
    "The stem plus やすい means easy to. The stem plus にくい means hard to. Both then work like い-adjectives.",
    "The two can sit together. 読みやすい書き方 is a way of writing that is easy to read.",
    # Day 47
    "The た form plus ことがある means you have the experience of doing it. たことがない means you never have.",
    "The dictionary form plus ことがある means it sometimes happens. The た form is the one that means you have done it before.",
    "The plain form plus のに means even though, often with the feeling and yet. A noun or a な-adjective needs な: 静かなのに.",
    # Day 48
    "A noun plus について means about. Use it for the topic of a meeting.",
    "AをBと呼びます means we call A by the name B.",
    "Aの役割はBです means A's role is B. 役割 means role.",
    # Day 49
    "本日 is the formal word for today. Put the purpose of the meeting right after it.",
    "させていただきます says that you will do the action, politely. Do not use it for the client's action.",
    "Name how the meeting starts and how it ends, so the other person can see the shape of the hour.",
    # Day 50
    "てほしいです means I want you to do this. A client uses it to ask for a change.",
    "ています describes the way the work happens now.",
    "回 counts how often. 件 counts how many cases or items. 一回 is once. 一件 is one item.",
    # Day 51
    "つまり, then ということですね, means so you mean. Use it to check a vague request in plain words.",
    "具体的には means specifically. Use it when you need one real case, not a general wish.",
    "The plain form plus 場合は means when that case happens. A noun needs の: エラーの場合は.",
    # Day 52
    "という理解で合っていますか asks whether your reading of what they said is right.",
    "認識が違います means that is not how we see it. Ask which point is wrong before you argue.",
    "確認させてください means please let me confirm. Say it before you write the note down.",
    # Day 53
    "今回の範囲は〜です says what this round of work includes.",
    "〜は対象外です says that item is outside this round. Say the exclusion out loud.",
    "次回に回します means we will move it to the next round.",
    # Day 54
    "A plain clause plus と決まりました means it was decided that. You are reporting the decision.",
    "持ち帰りは〜です names the item someone will take away and answer later. Say who owns it, and by when.",
    "次は〜に送ります says what you will send next, and by when.",
    # Day 55
    "前提は〜です states the assumption the number depends on. Say the assumption together with the price.",
    "人日 is a person-day. 一人日 is one person-day. Read 人 here as にん.",
    "税別 means before tax. 税込 means tax included. Say one of them with every price.",
    # Day 56
    "までに is the deadline. 終わらせます means I will get it finished by then.",
    "中間確認は〜です names the check in the middle of the work. Give the day. Do not wait until the end to show it.",
    "てから means the next step starts only after the earlier one is finished.",
    # Day 57
    "A plain phrase plus のは難しいです names the hard thing: doing that is difficult. It talks about the work, not the person.",
    "代わりに〜ではどうですか offers one smaller alternative: how about this instead.",
    "段階的に means in stages. Use it when the whole job cannot be done at once.",
    # Day 58
    "承知しました means understood. Follow it at once with how you will proceed, so the word is not left vague.",
    "条件は〜ことです states the condition. The condition is a plain clause plus こと. If it fails, the agreement fails with it.",
    "〜に一任します means we leave that decision to them. Use it only when you truly hand the choice over.",
    # Day 59
    "今回は見送らせてください means please let this one wait. It is a no for this round, said softly.",
    "〜れば対応できます means if that holds, we can do it. Show the condition that turns a no into a yes.",
    "代案は〜です gives one alternative. Offer one path, not several.",
    # Day 60
    "In an email, させていただきます says what you yourself will do, politely. Do not use it for an action the client must do.",
    "ご検討ください means please consider it. It asks the client to act.",
    "ご返信をお待ちしております means I am waiting for your reply. It closes the email.",
    # Day 61
    "結論から申します means I will start with the conclusion. 申します is the humble word for say.",
    "より marks the option you set aside. の方が marks the one you recommend.",
    "〜をお願いいたします is a humble please. Put the request after the conclusion is clear.",
    # Day 62
    "画面の流れは〜です names the steps on the screen, in order. Three steps is enough to follow.",
    "A plain verb plus と, then になります, means when you do this, it becomes that. One action, one result.",
    "入力欄に〜を入れます means you type this in the field. Say what is typed, and what is only shown.",
    # Day 63
    "今からお見せします means I will show you now. Say what you will show, then change the screen.",
    "〜をクリックすると means when you click this. The next words are what the other person will see.",
    "ご質問はありますか means do you have a question. Pause after each step and ask.",
    # Day 64
    "ているところです means the work is in the middle right now.",
    "たばかりです means it has just finished. Do not use it for something that ended long ago.",
    "The dictionary form plus ところです means it is just about to start. It has not started yet.",
    # Day 65
    "割 is one tenth. 五割 is half. 八割終わっています means eighty percent is finished.",
    "残りは〜です says what is left. Give it as days of work, or as a piece of the screen, not only as a percent.",
    "見通しは〜です is your outlook. Tie it to what is left. It is a judgment, not a wish.",
    # Day 66
    "遅延の理由は〜です gives one factual reason for the delay. If you are guessing, say that it is a guess.",
    "新しい日付は〜です gives the new date in the same message as the apology.",
    "〜で取り戻します says how you will make up the lost time. Name the actual step.",
    # Day 67
    "ているうちに means while that is still going on. Do the next action before that state ends.",
    "ないうちに means while it has not happened yet, or before it happens.",
    "あいだに means during that span, a period with a start and an end.",
    # Day 68
    "変更内容は〜です says what is changing. Keep one change to one item.",
    "影響は〜です says the effect on effort, cost, or the date. If one of those does not move, say that too.",
    "再見積してから受諾します means we accept after we see the new estimate. The number comes before the yes.",
    # Day 69
    "事象は〜です says what was seen on the screen. It is not yet a cause, and it does not name a person.",
    "暫定 is the fix for now. 恒久 is the lasting fix. Say both.",
    "〜ても再現します means it still happens even if you try that. Use it to rule out a guess.",
    # Day 70
    "させられる, or される, means be made to do something. 待つ becomes 待たされる, be kept waiting. You may hear it under pressure. Do not say it to the client.",
    "しわ寄せは〜に来ています means the extra burden is landing on that person or team. Name the place.",
    "決定権は〜にあります means the decision sits with that person. Then give two choices.",
    # Day 71
    "受入条件は〜です states a test someone else could run. It works is not a condition.",
    "合格です means this item passes. 不合格です means it fails. Say which item.",
    "条件付きで合格にします means we pass it on one condition. Name what is left, and the date.",
    # Day 72
    "停止時間は〜です says how long the system will be down. Give the clock time, not a short while.",
    "〜たら、切り戻します means if that happens, we put the old version back. Write this rule before you start.",
    "反映後に〜を確認します means after the change is applied, we check this. The release is finished when a real path works.",
    # Day 73
    "問い合わせは〜に入ります says where a question arrives. Name one front door.",
    "対応期限は〜です is the time the answer is due. Give a clock time, not soon.",
    "既知 means you have seen this question before. 未知 means you have not. Sort it before you start looking.",
    # Day 74
    "申し訳ございません is a formal I am sorry. Say it once, then give the fact.",
    "ご指摘のとおりです means it is as you pointed out. Agree with the true part before you add any context.",
    "再発防止は〜です says what will stop a repeat. Name the action and the day.",
    # Day 75
    "という理解で合っていますか says a decision back and asks if that reading is right. Use it after each decision, not only at the end.",
    "ところです answers where the work is. It can mean about to start, in the middle, or just finished.",
    "確認させていただきます closes on the next thing you will confirm, and leaves room for a correction.",
    # Day 76
    "だけでなく adds a second thing without erasing the first: not only this, but also that.",
    "現状値 is the number now. 目標値 is the number you are aiming for. Ask for both.",
    "副経路は次回です means the side route waits until next time. Say what stays in this round, and what does not.",
    # Day 77
    "一方で holds two facts in one breath: and on the other side. Use it so the price and the exclusion are heard together.",
    "明示しないものは、含みません means what is not written down is not included.",
    "推奨案は〜です marks the option you recommend. Offer three options at most, and mark one.",
    # Day 78
    "A noun plus を踏まえて means based on that thing. The next clause is what you will do because of it.",
    "採用 is what you will take. 見送り is what you will not take. Sort the comments before you leave the room.",
    "その場で直す means we will fix it here. 持ち帰って直す means we will take it away and fix it. Say which is which.",
    # Day 79
    "A noun plus に沿って means in line with a written rule, a specification, or a policy.",
    "準拠です means it stays inside that line. 逸脱です means it leaves the line. Say which one in the first sentence.",
    "口頭では変えません means spoken words do not change the written agreement. The written record does.",
    # Day 80
    "A noun plus 次第です means it depends on that thing. Do not use it to hide a date you already know.",
    "The verb stem plus 次第 means as soon as that happens. 終わり次第、連絡します means I will write the moment it is finished.",
    "定時連絡は〜です names the regular time you will write, even when nothing has changed.",
    # Day 81
    "The dictionary form plus 所存です is a formal I intend to. It belongs in a letter, not in a hallway.",
    "〜をご提出いたします means I humbly submit this. いたします is the humble form of します. Name the attachments in the same sentence.",
    "検収のほど、お願いいたします asks for formal acceptance. ほど softens the request. Put the deadline in the same sentence.",
    # Day 82
    "事象は〜ということです says back what was reported. Use the plain form before という.",
    "今は〜ところです says where this ticket is: about to start, in the middle, or just finished.",
    "対応を確認させていただきます means I will confirm how we respond. Close with who owns it, when, and the path for now.",
]

ROOT = os.path.dirname(os.path.abspath(__file__))
COURSE = os.path.join(ROOT, "data", "course.json")


def titles():
    with io.open(COURSE, "r", encoding="utf-8") as handle:
        course = json.load(handle)
    found = []
    for day in course.get("days") or []:
        for pattern in day.get("grammar") or []:
            found.append(pattern.get("title") or "")
    return found


def mapping():
    found = titles()
    if len(found) != len(LINES):
        raise ValueError("grammar notes %s, patterns %s" % (len(LINES), len(found)))
    return dict(zip(found, LINES))


PLAIN = mapping()
