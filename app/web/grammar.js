(function () {
  function line(jp, hira, romaji, en) {
    return { jp: jp, hira: hira, romaji: romaji, en: en };
  }

  function pair(a, b) {
    return [line.apply(null, a), line.apply(null, b)];
  }

  var book = {
    "A は B です — A is B": pair(
      ["この森は大切です。", "このもりはたいせつです。", "Kono mori wa taisetsu desu.", "This forest is important."],
      ["川の水はきれいです。", "かわのみずはきれいです。", "Kawa no mizu wa kirei desu.", "The river water is clean."]
    ),
    "A は B ですか — Is A B?": pair(
      ["この森は大切ですか。", "このもりはたいせつですか。", "Kono mori wa taisetsu desu ka.", "Is this forest important?"],
      ["水はきれいですか。", "みずはきれいですか。", "Mizu wa kirei desu ka.", "Is the water clean?"]
    ),
    "A を Vます — I do A": pair(
      ["水を守ります。", "みずをまもります。", "Mizu o mamorimasu.", "I protect the water."],
      ["ごみを減らします。", "ごみをへらします。", "Gomi o herashimasu.", "I reduce trash."]
    ),
    "これ／それ／あれ — this, that, that over there": pair(
      ["これは再利用のびんです。", "これはさいりようのびんです。", "Kore wa sairiyō no bin desu.", "This is a reusable bottle."],
      ["あれは森です。", "あれはもりです。", "Are wa mori desu.", "That over there is a forest."]
    ),
    "何ですか — what is it?": pair(
      ["これは何ですか。", "これはなんですか。", "Kore wa nan desu ka.", "What is this?"],
      ["この葉は何ですか。", "このははなんですか。", "Kono ha wa nan desu ka.", "What is this leaf?"]
    ),
    "Noun は い-adjective です": pair(
      ["森は大きいです。", "もりはおおきいです。", "Mori wa ōkii desu.", "The forest is large."],
      ["海は深いです。", "うみはふかいです。", "Umi wa fukai desu.", "The sea is deep."]
    ),
    "Place に あります／います": pair(
      ["公園に木があります。", "こうえんにきがあります。", "Kōen ni ki ga arimasu.", "There is a tree in the park."],
      ["森に鳥がいます。", "もりにとりがいます。", "Mori ni tori ga imasu.", "There is a bird in the forest."]
    ),
    "Place へ 行きます": pair(
      ["森へ行きます。", "もりへいきます。", "Mori e ikimasu.", "I go to the forest."],
      ["川へ行きます。", "かわへいきます。", "Kawa e ikimasu.", "I go to the river."]
    ),
    "Place は どこですか": pair(
      ["森はどこですか。", "もりはどこですか。", "Mori wa doko desu ka.", "Where is the forest?"],
      ["きれいな川はどこですか。", "きれいかわはどこですか。", "Kirei na kawa wa doko desu ka.", "Where is the clean river?"]
    ),
    "Reading bigger numbers": pair(
      ["苗は三百円です。", "なえはさんびゃくえんです。", "Nae wa sanbyaku en desu.", "The seedling is 300 yen."],
      ["再生紙は八千円です。", "さいせいしははっせんえんです。", "Saiseishi wa hassen en desu.", "The recycled paper is 8,000 yen."]
    ),
    "Price — いくらですか": pair(
      ["この苗はいくらですか。", "このなえはいくらですか。", "Kono nae wa ikura desu ka.", "How much is this seedling?"],
      ["水筒は二千円です。", "すいとうはにせんえんです。", "Suitō wa nisen en desu.", "The water bottle is 2,000 yen."]
    ),
    "Counters — number + 個 / 人 / 枚": pair(
      ["びんが三個あります。", "びんがさんこあります。", "Bin ga sanko arimasu.", "There are three bottles."],
      ["再生紙が四枚あります。", "さいせいしがよんまいあります。", "Saiseishi ga yonmai arimasu.", "There are four sheets of recycled paper."]
    ),
    "Time に": pair(
      ["七時に木を植えます。", "しちじにきをうえます。", "Shichiji ni ki o uemasu.", "I plant a tree at seven."],
      ["朝に水をやります。", "あさにみずをやります。", "Asa ni mizu o yarimasu.", "I water the plants in the morning."]
    ),
    "から ～ まで": pair(
      ["九時から五時まで森を見ます。", "くじからごじまでもりをみます。", "Kuji kara goji made mori o mimasu.", "I watch the forest from nine until five."],
      ["春から秋まで花が咲きます。", "はるからあきまではながさきます。", "Haru kara aki made hana ga sakimasu.", "Flowers bloom from spring until autumn."]
    ),
    "何時ですか / 何曜日ですか": pair(
      ["清掃は何時ですか。", "せいそうはなんじですか。", "Seisō wa nanji desu ka.", "What time is the cleanup?"],
      ["収集は何曜日ですか。", "しゅうしゅうはなんようびですか。", "Shūshū wa nanyōbi desu ka.", "What day is the collection?"]
    ),
    "この / その / あの + noun": pair(
      ["この森は静かです。", "このもりはしずかです。", "Kono mori wa shizuka desu.", "This forest is quiet."],
      ["あの川はきれいです。", "あのかわはきれいです。", "Ano kawa wa kirei desu.", "That river over there is clean."]
    ),
    "Noun の Noun": pair(
      ["森の水は冷たいです。", "もりのみずはつめたいです。", "Mori no mizu wa tsumetai desu.", "The forest's water is cold."],
      ["地球の未来を考えます。", "ちきゅうのみらいをかんがえます。", "Chikyū no mirai o kangaemasu.", "I think about the earth's future."]
    ),
    "も and と": pair(
      ["森も川も守ります。", "もりもかわもまもります。", "Mori mo kawa mo mamorimasu.", "I protect both the forest and the river."],
      ["水と風を大切にします。", "みずとかぜをたいせつにします。", "Mizu to kaze o taisetsu ni shimasu.", "I take care of water and wind."]
    ),
    "Place で + action": pair(
      ["公園でごみを集めます。", "こうえんでごみをあつめます。", "Kōen de gomi o atsumemasu.", "I collect trash at the park."],
      ["川で水を調べます。", "かわでみずをしらべます。", "Kawa de mizu o shirabemasu.", "I test the water at the river."]
    ),
    "Tool で": pair(
      ["自転車で森へ行きます。", "じてんしゃでもりへいきます。", "Jitensha de mori e ikimasu.", "I go to the forest by bicycle."],
      ["水筒で水を持ちます。", "すいとうでみずをもちます。", "Suitō de mizu o mochimasu.", "I carry water in a bottle."]
    ),
    "に or で? Choose by the verb": pair(
      ["森に木があります。", "もりにきがあります。", "Mori ni ki ga arimasu.", "There are trees in the forest. に fits あります."],
      ["公園でごみを集めます。", "こうえんでごみをあつめます。", "Kōen de gomi o atsumemasu.", "I collect trash at the park. で fits the action."]
    ),
    "Vません": pair(
      ["川を汚しません。", "かわをよごしません。", "Kawa o yogoshimasen.", "I do not pollute the river."],
      ["プラスチックを買いません。", "ぷらすちっくをかいません。", "Purasuchikku o kaimasen.", "I do not buy plastic."]
    ),
    "Vました": pair(
      ["木を植えました。", "きをうえました。", "Ki o uemashita.", "I planted a tree."],
      ["ごみを減らしました。", "ごみをへらしました。", "Gomi o herashimashita.", "I reduced the trash."]
    ),
    "Vませんでした and question words": pair(
      ["昨日は電気を消しませんでした。", "きのうはでんきをけしませんでした。", "Kinō wa denki o keshimasen deshita.", "I did not turn the lights off yesterday."],
      ["誰が水を汚しましたか。", "だれがみずをよごしましたか。", "Dare ga mizu o yogoshimashita ka.", "Who polluted the water?"]
    ),
    "Frequency words sit before the verb": pair(
      ["毎日水を節約します。", "まいにちみずをせつやくします。", "Mainichi mizu o setsuyaku shimasu.", "I save water every day."],
      ["ときどき森を歩きます。", "ときどきもりをあるきます。", "Tokidoki mori o arukimasu.", "I sometimes walk in the forest."]
    ),
    "もう + past, まだ + negative": pair(
      ["もう電気を消しました。", "もうでんきをけしました。", "Mō denki o keshimashita.", "I already turned the lights off."],
      ["まだ木を植えていません。", "まだきをうえていません。", "Mada ki o uete imasen.", "I have not planted the tree yet."]
    ),
    "回 — how many times": pair(
      ["週に二回、川を見ます。", "しゅうににかい、かわをみます。", "Shū ni nikai, kawa o mimasu.", "I look at the river twice a week."],
      ["月に一回、森を掃除します。", "つきにいっかい、もりをそうじします。", "Tsuki ni ikkai, mori o sōji shimasu.", "I clean the forest once a month."]
    ),
    "い-adjectives — negative and past": pair(
      ["この川は深くないです。", "このかわはふかくないです。", "Kono kawa wa fukakunai desu.", "This river is not deep."],
      ["去年の森は大きかったです。", "きょねんのもりはおおきかったです。", "Kyonen no mori wa ōkikatta desu.", "Last year's forest was large."]
    ),
    "な-adjectives — じゃない and でした": pair(
      ["この水はきれいじゃないです。", "このみずはきれいじゃないです。", "Kono mizu wa kirei ja nai desu.", "This water is not clean."],
      ["あの森は静かでした。", "あのもりはしずかでした。", "Ano mori wa shizuka deshita.", "That forest was quiet."]
    ),
    "とても / 少し, and adjective + noun": pair(
      ["この森はとても静かです。", "このもりはとてもしずかです。", "Kono mori wa totemo shizuka desu.", "This forest is very quiet."],
      ["少し冷たい水を飲みます。", "すこしつめたいみずをのみます。", "Sukoshi tsumetai mizu o nomimasu.", "I drink water that is a little cold."]
    ),
    "Noun が 好きです / 嫌いです": pair(
      ["森が好きです。", "もりがすきです。", "Mori ga suki desu.", "I like forests."],
      ["ごみが嫌いです。", "ごみがきらいです。", "Gomi ga kirai desu.", "I dislike trash."]
    ),
    "Noun が 上手です / 下手です / 得意です / 苦手です": pair(
      ["水の節約が得意です。", "みずのせつやくがとくいです。", "Mizu no setsuyaku ga tokui desu.", "I am good at saving water."],
      ["木の名前が苦手です。", "きのなまえがにがてです。", "Ki no namae ga nigate desu.", "Tree names are hard for me."]
    ),
    "Noun が 欲しいです": pair(
      ["新しい水筒が欲しいです。", "あたらしいすいとうがほしいです。", "Atarashii suitō ga hoshii desu.", "I want a new water bottle."],
      ["苗が欲しいです。", "なえがほしいです。", "Nae ga hoshii desu.", "I want seedlings."]
    ),
    "Verb stem + たいです": pair(
      ["森を歩きたいです。", "もりをあるきたいです。", "Mori o arukitai desu.", "I want to walk in the forest."],
      ["水を守りたいです。", "みずをまもりたいです。", "Mizu o mamoritai desu.", "I want to protect the water."]
    ),
    "Vませんか — an invitation": pair(
      ["一緒に木を植えませんか。", "いっしょにきをうえませんか。", "Issho ni ki o uemasen ka.", "Shall we plant a tree together?"],
      ["川を掃除しませんか。", "かわをそうじしませんか。", "Kawa o sōji shimasen ka.", "Shall we clean the river?"]
    ),
    "Vましょう / Vましょうか": pair(
      ["電気を消しましょう。", "でんきをけしましょう。", "Denki o keshimashō.", "Let's turn the lights off."],
      ["水筒を洗いましょうか。", "すいとうをあらいましょうか。", "Suitō o araimashō ka.", "Shall I wash the bottle?"]
    ),
    "Godan verbs (the large group)": pair(
      ["守るは五段です。水を守ります。", "まもるはごだんです。みずをまもります。", "Mamoru wa godan desu. Mizu o mamorimasu.", "守る is a godan verb: I protect the water."],
      ["減らすは五段です。ごみを減らします。", "へらすはごだんです。ごみをへらします。", "Herasu wa godan desu. Gomi o herashimasu.", "減らす is a godan verb: I reduce trash."]
    ),
    "Ichidan verbs": pair(
      ["捨てるは一段です。ごみを捨てます。", "すてるはいちだんです。ごみをすてます。", "Suteru wa ichidan desu. Gomi o sutemasu.", "捨てる is an ichidan verb: I throw trash away."],
      ["見るは一段です。森を見ます。", "みるはいちだんです。もりをみます。", "Miru wa ichidan desu. Mori o mimasu.", "見る is an ichidan verb: I look at the forest."]
    ),
    "Three irregulars": pair(
      ["する：リサイクルをします。", "する：りさいくるをします。", "Suru: risaikuru o shimasu.", "する is irregular: I recycle."],
      ["来る：森へ来ます。", "くる：もりへきます。", "Kuru: mori e kimasu.", "来る is irregular: I come to the forest."]
    ),
    "Vてください — please do": pair(
      ["水を守ってください。", "みずをまもってください。", "Mizu o mamotte kudasai.", "Please protect the water."],
      ["ごみを減らしてください。", "ごみをへらしてください。", "Gomi o herashite kudasai.", "Please reduce the trash."]
    ),
    "Vてから — only after doing": pair(
      ["手を洗ってから、苗に水をやります。", "てをあらってから、なえにみずをやります。", "Te o aratte kara, nae ni mizu o yarimasu.", "I water the seedlings only after I wash my hands."],
      ["びんを洗ってから、再利用します。", "びんをあらってから、さいりようします。", "Bin o aratte kara, sairiyō shimasu.", "I reuse the bottle only after I wash it."]
    ),
    "Vないでください — please don’t": pair(
      ["水を汚さないでください。", "みずをよごさないでください。", "Mizu o yogosanaide kudasai.", "Please do not pollute the water."],
      ["森の木を切らないでください。", "もりのきをきらないでください。", "Mori no ki o kiranaide kudasai.", "Please do not cut the forest trees."]
    ),
    "An action in progress": pair(
      ["今、木を植えています。", "いま、きをうえています。", "Ima, ki o uete imasu.", "I am planting a tree now."],
      ["鳥が鳴いています。", "とりがないています。", "Tori ga naite imasu.", "A bird is singing."]
    ),
    "A state that remains": pair(
      ["電気は消えています。", "でんきはきえています。", "Denki wa kiete imasu.", "The lights are off."],
      ["窓は閉まっています。", "まどはしまっています。", "Mado wa shimatte imasu.", "The window is shut."]
    ),
    "まだ ～ていません — not yet done": pair(
      ["まだ木を植えていません。", "まだきをうえていません。", "Mada ki o uete imasen.", "I have not planted the tree yet."],
      ["まだ水を止めていません。", "まだみずをとめていません。", "Mada mizu o tomete imasen.", "I have not turned the water off yet."]
    ),
    "Vてもいいです — you may": pair(
      ["ここで水を飲んでもいいです。", "ここでみずをのんでもいいです。", "Koko de mizu o nonde mo ii desu.", "You may drink water here."],
      ["自転車を置いてもいいです。", "じてんしゃをおいてもいいです。", "Jitensha o oite mo ii desu.", "You may leave the bicycle here."]
    ),
    "Vてはいけません — you must not": pair(
      ["ここでごみを捨ててはいけません。", "ここでごみをすててはいけません。", "Koko de gomi o sutete wa ikemasen.", "You must not throw trash away here."],
      ["森の花を取ってはいけません。", "もりのはなをとってはいけません。", "Mori no hana o totte wa ikemasen.", "You must not pick the forest flowers."]
    ),
    "Vなくてもいいです — you don’t have to": pair(
      ["毎日来なくてもいいです。", "まいにちこなくてもいいです。", "Mainichi konakute mo ii desu.", "You do not have to come every day."],
      ["新しいびんを買わなくてもいいです。", "あたらしいびんをかわなくてもいいです。", "Atarashii bin o kawanakute mo ii desu.", "You do not have to buy a new bottle."]
    ),
    "Sentence + から — because": pair(
      ["水が少ないから、節約します。", "みずがすくないから、せつやくします。", "Mizu ga sukunai kara, setsuyaku shimasu.", "I save water because there is little of it."],
      ["森が好きだから、毎週行きます。", "もりがすきだから、まいしゅういきます。", "Mori ga suki da kara, maishū ikimasu.", "I go every week because I like the forest."]
    ),
    "Sentence + ので — because, a bit softer": pair(
      ["森が大切なので、木を切りません。", "もりがたいせつなので、きをきりません。", "Mori ga taisetsu na node, ki o kirimasen.", "I do not cut trees, since the forest is important."],
      ["雨なので、水をためます。", "あめなので、みずをためます。", "Ame na node, mizu o tamemasu.", "I store water, since it is raining."]
    ),
    "が and けど — but": pair(
      ["風は強いですが、自転車で行きます。", "かぜはつよいですが、じてんしゃでいきます。", "Kaze wa tsuyoi desu ga, jitensha de ikimasu.", "The wind is strong, but I go by bicycle."],
      ["雨だけど、木を植えます。", "あめだけど、きをうえます。", "Ame da kedo, ki o uemasu.", "It is raining, but I plant the tree."]
    ),
    "A は B より adjective": pair(
      ["この川はあの川よりきれいです。", "このかわはあのかわよりきれいです。", "Kono kawa wa ano kawa yori kirei desu.", "This river is cleaner than that river."],
      ["自転車は車より静かです。", "じてんしゃはくるまよりしずかです。", "Jitensha wa kuruma yori shizuka desu.", "A bicycle is quieter than a car."]
    ),
    "A のほうが B より adjective": pair(
      ["森のほうが町より静かです。", "もりのほうがまちよりしずかです。", "Mori no hō ga machi yori shizuka desu.", "The forest is quieter than the town."],
      ["水筒のほうがプラスチックよりいいです。", "すいとうのほうがぷらすちっくよりいいです。", "Suitō no hō ga purasuchikku yori ii desu.", "A bottle is better than plastic."]
    ),
    "どちら / どれ / 一番": pair(
      ["どちらの森が一番大きいですか。", "どちらのもりがいちばんおおきいですか。", "Dochira no mori ga ichiban ōkii desu ka.", "Which forest is the largest?"],
      ["この木が一番高いです。", "このきがいちばんたかいです。", "Kono ki ga ichiban takai desu.", "This tree is the tallest."]
    ),
    "Dictionary form": pair(
      ["水を守る。", "みずをまもる。", "Mizu o mamoru.", "Protect the water. The plain form is 守る."],
      ["ごみを減らす。", "ごみをへらす。", "Gomi o herasu.", "Reduce trash. The plain form is 減らす."]
    ),
    "ない form, finished": pair(
      ["川を汚さない。", "かわをよごさない。", "Kawa o yogosanai.", "Do not pollute the river. The ない form is 汚さない."],
      ["木を切らない。", "きをきらない。", "Ki o kiranai.", "Do not cut the tree. The ない form is 切らない."]
    ),
    "Plain past — the た form": pair(
      ["木を植えた。", "きをうえた。", "Ki o ueta.", "Planted a tree. The た form is 植えた."],
      ["水を節約した。", "みずをせつやくした。", "Mizu o setsuyaku shita.", "Saved water. The た form is 節約した."]
    ),
    "Plain + と思います": pair(
      ["森は大切だと思います。", "もりはたいせつだとおもいます。", "Mori wa taisetsu da to omoimasu.", "I think the forest is important."],
      ["明日は雨が降ると思います。", "あしたはあめがふるとおもいます。", "Ashita wa ame ga furu to omoimasu.", "I think it will rain tomorrow."]
    ),
    "Plain + と言います": pair(
      ["先生は水が大切だと言います。", "せんせいはみずがたいせつだといいます。", "Sensei wa mizu ga taisetsu da to iimasu.", "The teacher says water is important."],
      ["友だちが森へ行こうと言います。", "ともだちがもりへいこうといいます。", "Tomodachi ga mori e ikō to iimasu.", "My friend says, let's go to the forest."]
    ),
    "Plain + かもしれません — might": pair(
      ["明日は雨かもしれません。", "あしたはあめかもしれません。", "Ashita wa ame ka mo shiremasen.", "It might rain tomorrow."],
      ["この川は汚いかもしれません。", "このかわはきたないかもしれません。", "Kono kawa wa kitanai ka mo shiremasen.", "This river might be dirty."]
    ),
    "Plain verb + noun": pair(
      ["水を守る人がいます。", "みずをまもるひとがいます。", "Mizu o mamoru hito ga imasu.", "There are people who protect the water."],
      ["森に住む鳥を見ます。", "もりにすむとりをみます。", "Mori ni sumu tori o mimasu.", "I watch the birds that live in the forest."]
    ),
    "Adjective + noun, including a short clause": pair(
      ["きれいな川で泳ぎます。", "きれいかわでおよぎます。", "Kirei na kawa de oyogimasu.", "I swim in a clean river."],
      ["大きい森を歩きます。", "おおきいもりをあるきます。", "Ōkii mori o arukimasu.", "I walk through a large forest."]
    ),
    "こと and の turn a verb into a noun": pair(
      ["木を植えることが好きです。", "きをうえることがすきです。", "Ki o ueru koto ga suki desu.", "I like planting trees."],
      ["川で泳ぐのが好きです。", "かわでおよぐのがすきです。", "Kawa de oyogu no ga suki desu.", "I like swimming in the river."]
    ),
    "Dictionary とき and た とき": pair(
      ["森へ行くとき、水を持ちます。", "もりへいくとき、みずをもちます。", "Mori e iku toki, mizu o mochimasu.", "When I go to the forest, I bring water."],
      ["木を植えたとき、鳥が来ました。", "きをうえたとき、とりがきました。", "Ki o ueta toki, tori ga kimashita.", "When I planted the tree, a bird came."]
    ),
    "前に and 後で": pair(
      ["植える前に、水をやります。", "うえるまえに、みずをやります。", "Ueru mae ni, mizu o yarimasu.", "I water the ground before I plant."],
      ["植えた後で、休みます。", "うえたあとで、やすみます。", "Ueta ato de, yasumimasu.", "I rest after I plant."]
    ),
    "あいだ and 期間": pair(
      ["夏の間、水を節約します。", "なつのあいだ、みずをせつやくします。", "Natsu no aida, mizu o setsuyaku shimasu.", "I save water during the summer."],
      ["この期間、電気を消します。", "このきかん、でんきをけします。", "Kono kikan, denki o keshimasu.", "I turn the lights off during this period."]
    ),
    "Dictionary form + ことができる": pair(
      ["ここで自転車を置くことができます。", "ここでじてんしゃをおくことができます。", "Koko de jitensha o oku koto ga dekimasu.", "You can leave a bicycle here."],
      ["この水は飲むことができます。", "このみずはのむことができます。", "Kono mizu wa nomu koto ga dekimasu.", "This water can be drunk."]
    ),
    "The potential form": pair(
      ["この瓶は再利用できます。", "このびんはさいりようできます。", "Kono bin wa sairiyō dekimasu.", "This bottle can be reused."],
      ["一人で木を植えられます。", "ひとりできをうえられます。", "Hitori de ki o ueraremasu.", "I can plant a tree by myself."]
    ),
    "見える and 聞こえる": pair(
      ["山から海が見えます。", "やまからうみがみえます。", "Yama kara umi ga miemasu.", "The sea is visible from the mountain."],
      ["鳥の声が聞こえます。", "とりのこえがきこえます。", "Tori no koe ga kikoemasu.", "I can hear the birds."]
    ),
    "Stem + ながら — while": pair(
      ["歩きながら、川を見ます。", "あるきながら、かわをみます。", "Arukinagara, kawa o mimasu.", "I look at the river while I walk."],
      ["音楽を聞きながら、ごみを分けます。", "おんがくをききながら、ごみをわけます。", "Ongaku o kikinagara, gomi o wakemasu.", "I sort trash while I listen to music."]
    ),
    "たり … たりする — a sample of actions": pair(
      ["木を植えたり、水をやったりします。", "きをうえたり、みずをやったりします。", "Ki o uetari, mizu o yattari shimasu.", "I do things like planting trees and watering them."],
      ["歩いたり、鳥を見たりします。", "あるいたり、とりをみたりします。", "Aruitari, tori o mitari shimasu.", "I do things like walking and watching birds."]
    ),
    "Choose て, ながら, or たり": pair(
      ["びんを洗って、再利用します。", "びんをあらって、さいりようします。", "Bin o aratte, sairiyō shimasu.", "I wash the bottle and then reuse it. て links the steps."],
      ["風を感じながら歩きます。", "かぜをかんじながらあるきます。", "Kaze o kanjinagara arukimasu.", "I walk while I feel the wind. ながら is at the same time."]
    ),
    "Dictionary form + つもりです": pair(
      ["明日、木を植えるつもりです。", "あした、きをうえるつもりです。", "Ashita, ki o ueru tsumori desu.", "I intend to plant a tree tomorrow."],
      ["川を汚さないつもりです。", "かわをよごさないつもりです。", "Kawa o yogosanai tsumori desu.", "I intend not to pollute the river."]
    ),
    "ない form + つもりです": pair(
      ["プラスチックを買わないつもりです。", "ぷらすちっくをかわないつもりです。", "Purasuchikku o kawanai tsumori desu.", "I intend not to buy plastic."],
      ["水を無駄にしないつもりです。", "みずをむだにしないつもりです。", "Mizu o muda ni shinai tsumori desu.", "I intend not to waste water."]
    ),
    "Plain + でしょう — a prediction": pair(
      ["明日は晴れでしょう。", "あしたははれでしょう。", "Ashita wa hare deshō.", "It will probably be clear tomorrow."],
      ["森はもっと大きくなるでしょう。", "もりはもっとおおきくなるでしょう。", "Mori wa motto ōkiku naru deshō.", "The forest will probably grow larger."]
    ),
    "Verb た form + ら": pair(
      ["雨が降ったら、水をためます。", "あめがふったら、みずをためます。", "Ame ga futtara, mizu o tamemasu.", "If it rains, I will store water."],
      ["春になったら、花を植えます。", "はるになったら、はなをうえます。", "Haru ni nattara, hana o uemasu.", "When spring comes, I will plant flowers."]
    ),
    "Adjective and noun + たら": pair(
      ["水が少なかったら、節約します。", "みずがすくなかったら、せつやくします。", "Mizu ga sukunakattara, setsuyaku shimasu.", "If the water gets low, I will save it."],
      ["雨だったら、室内でびんを洗います。", "あめだったら、しつないでびんをあらいます。", "Ame dattara, shitsunai de bin o araimasu.", "If it is rain, I wash bottles indoors."]
    ),
    "もし and 場合": pair(
      ["もし水が少なかったら、節約します。", "もしみずがすくなかったら、せつやくします。", "Moshi mizu ga sukunakattara, setsuyaku shimasu.", "If the water is scarce, I save it."],
      ["雨の場合は、室内でびんを洗います。", "あめのばあいは、しつないでびんをあらいます。", "Ame no baai wa, shitsunai de bin o araimasu.", "In the case of rain, I wash bottles indoors."]
    ),
    "Dictionary form + と — automatic result": pair(
      ["春になると、花が咲きます。", "はるになると、はながさきます。", "Haru ni naru to, hana ga sakimasu.", "When spring comes, the flowers bloom."],
      ["このスイッチを押すと、電気が消えます。", "このすいっちをおすと、でんきがきえます。", "Kono suitchi o osu to, denki ga kiemasu.", "When you press this switch, the light goes off."]
    ),
    "Plain + なら — if that is the case": pair(
      ["森へ行くなら、水を持ってください。", "もりへいくなら、みずをもってください。", "Mori e iku nara, mizu o motte kudasai.", "If you are going to the forest, please bring water."],
      ["再利用するなら、びんを洗ってください。", "さいりようするなら、びんをあらってください。", "Sairiyō suru nara, bin o aratte kudasai.", "If you will reuse it, please wash the bottle."]
    ),
    "ても — even if": pair(
      ["雨が降っても、木を植えます。", "あめがふっても、きをうえます。", "Ame ga futte mo, ki o uemasu.", "I plant the tree even if it rains."],
      ["風が強くても、自転車で行きます。", "かぜがつよくても、じてんしゃでいきます。", "Kaze ga tsuyokute mo, jitensha de ikimasu.", "I go by bicycle even if the wind is strong."]
    ),
    "た form + ほうがいいです — had better": pair(
      ["水筒を持っていったほうがいいです。", "すいとうをもっていったほうがいいです。", "Suitō o motte itta hō ga ii desu.", "You had better take a water bottle."],
      ["電気を消したほうがいいです。", "でんきをけしたほうがいいです。", "Denki o keshita hō ga ii desu.", "You had better turn the lights off."]
    ),
    "ない form + ほうがいいです — better not": pair(
      ["プラスチックを買わないほうがいいです。", "ぷらすちっくをかわないほうがいいです。", "Purasuchikku o kawanai hō ga ii desu.", "You had better not buy plastic."],
      ["川でごみを捨てないほうがいいです。", "かわでごみをすてないほうがいいです。", "Kawa de gomi o sutenai hō ga ii desu.", "You had better not throw trash in the river."]
    ),
    "たらどうですか — why don’t you": pair(
      ["自転車で行ったらどうですか。", "じてんしゃでいったらどうですか。", "Jitensha de ittara dō desu ka.", "Why not go by bicycle?"],
      ["この瓶を再利用したらどうですか。", "このびんをさいりようしたらどうですか。", "Kono bin o sairiyō shitara dō desu ka.", "Why not reuse this bottle?"]
    ),
    "あげる — I give, or someone gives outward": pair(
      ["友だちに苗をあげます。", "ともだちになえをあげます。", "Tomodachi ni nae o agemasu.", "I give a seedling to my friend."],
      ["妹は近所に花をあげます。", "いもうとはきんじょにはなをあげます。", "Imōto wa kinjo ni hana o agemasu.", "My younger sister gives flowers to the neighbors."]
    ),
    "くれる — someone gives toward me": pair(
      ["友だちが私に苗をくれます。", "ともだちがわたしになえをくれます。", "Tomodachi ga watashi ni nae o kuremasu.", "My friend gives me a seedling."],
      ["先生が水の本をくれました。", "せんせいがみずのほんをくれました。", "Sensei ga mizu no hon o kuremashita.", "The teacher gave me a book about water."]
    ),
    "もらう — I receive": pair(
      ["地域の人に種をもらいます。", "ちいきのひとにたねをもらいます。", "Chiiki no hito ni tane o moraimasu.", "I receive seeds from people in the neighborhood."],
      ["友だちに水筒をもらいました。", "ともだちにすいとうをもらいました。", "Tomodachi ni suitō o moraimashita.", "I received a water bottle from my friend."]
    ),
    "Vてくれますか": pair(
      ["窓を閉めてくれますか。", "まどをしめてくれますか。", "Mado o shimete kuremasu ka.", "Would you close the window for me?"],
      ["この水を調べてくれますか。", "このみずをしらべてくれますか。", "Kono mizu o shirabete kuremasu ka.", "Would you test this water for me?"]
    ),
    "Vてもらえますか": pair(
      ["電気を消してもらえますか。", "でんきをけしてもらえますか。", "Denki o keshite moraemasu ka.", "Could you turn the lights off?"],
      ["びんを洗ってもらえますか。", "びんをあらってもらえますか。", "Bin o aratte moraemasu ka.", "Could you wash the bottle?"]
    ),
    "Vていただけますか": pair(
      ["この川について教えていただけますか。", "このかわについておしえていただけますか。", "Kono kawa ni tsuite oshiete itadakemasu ka.", "Could you please tell me about this river?"],
      ["計画を見ていただけますか。", "けいかくをみていただけますか。", "Keikaku o mite itadakemasu ka.", "Could I ask you to look at the plan?"]
    ),
    "Vてみる — try and see": pair(
      ["この水筒を使ってみます。", "このすいとうをつかってみます。", "Kono suitō o tsukatte mimasu.", "I will try using this water bottle."],
      ["自転車で行ってみます。", "じてんしゃでいってみます。", "Jitensha de itte mimasu.", "I will try going by bicycle."]
    ),
    "Vておく — do it in advance, or leave it that way": pair(
      ["水を用意しておきます。", "みずをよういしておきます。", "Mizu o yōi shite okimasu.", "I will get the water ready in advance."],
      ["窓は開けておきます。", "まどはあけておきます。", "Mado wa akete okimasu.", "I will leave the window open."]
    ),
    "Vてしまう — finish completely, or do by accident": pair(
      ["ごみを全部出してしまいました。", "ごみをぜんぶだしてしまいました。", "Gomi o zenbu dashite shimaimashita.", "I have put all the trash out."],
      ["水をこぼしてしまいました。", "みずをこぼしてしまいました。", "Mizu o koboshite shimaimashita.", "I spilled the water by accident."]
    ),
    "くなる and になる — become": pair(
      ["川がきれいになります。", "かわがきれいになります。", "Kawa ga kirei ni narimasu.", "The river becomes clean."],
      ["空が明るくなります。", "そらがあかるくなります。", "Sora ga akaruku narimasu.", "The sky becomes bright."]
    ),
    "くする and にする — make it that way": pair(
      ["音を小さくします。", "おとをちいさくします。", "Oto o chiisaku shimasu.", "I turn the sound down."],
      ["袋を再利用にします。", "ふくろをさいりようにします。", "Fukuro o sairiyō ni shimasu.", "I make the bag something we reuse."]
    ),
    "ことにする and ことになる": pair(
      ["自転車で行くことにします。", "じてんしゃでいくことにします。", "Jitensha de iku koto ni shimasu.", "I have decided to go by bicycle."],
      ["来月からプラスチックを減らすことになります。", "らいげつからぷらすちっくをへらすことになります。", "Raigetsu kara purasuchikku o herasu koto ni narimasu.", "It has been decided that we reduce plastic from next month."]
    ),
    "Dictionary form + ために — in order to": pair(
      ["森を守るために、木を植えます。", "もりをまもるために、きをうえます。", "Mori o mamoru tame ni, ki o uemasu.", "I plant trees in order to protect the forest."],
      ["水を節約するために、蛇口を閉めます。", "みずをせつやくするために、じゃぐちをしめます。", "Mizu o setsuyaku suru tame ni, jaguchi o shimemasu.", "I shut the tap in order to save water."]
    ),
    "ように — so that a state becomes true": pair(
      ["鳥が戻るように、水をきれいにします。", "とりがもどるように、みずをきれいにします。", "Tori ga modoru yō ni, mizu o kirei ni shimasu.", "I clean the water so that the birds come back."],
      ["忘れないように、びんを袋に入れます。", "わすれないように、びんをふくろにいれます。", "Wasurenai yō ni, bin o fukuro ni iremasu.", "I put the bottle in the bag so that I do not forget it."]
    ),
    "Noun のために — for the sake of": pair(
      ["地球のために、ごみを減らします。", "ちきゅうのために、ごみをへらします。", "Chikyū no tame ni, gomi o herashimasu.", "I reduce trash for the sake of the earth."],
      ["森のために、今日は車を使いません。", "もりのために、きょうはくるまをつかいません。", "Mori no tame ni, kyō wa kuruma o tsukaimasen.", "For the sake of the forest, I do not use a car today."]
    ),
    "なければならない — must": pair(
      ["水を守らなければなりません。", "みずをまもらなければなりません。", "Mizu o mamoranakereba narimasen.", "We must protect the water."],
      ["ごみを分けなければなりません。", "ごみをわけなければなりません。", "Gomi o wakenakereba narimasen.", "We must sort the trash."]
    ),
    "なくてもいい — you need not": pair(
      ["毎日来なくてもいいです。", "まいにちこなくてもいいです。", "Mainichi konakute mo ii desu.", "You need not come every day."],
      ["全部を今日やらなくてもいいです。", "ぜんぶをきょうやらなくてもいいです。", "Zenbu o kyō yaranakute mo ii desu.", "You need not do all of it today."]
    ),
    "Dictionary form + べきです — ought to": pair(
      ["森を守るべきです。", "もりをまもるべきです。", "Mori o mamoru beki desu.", "We ought to protect the forest."],
      ["川を汚すべきではありません。", "かわをよごすべきではありません。", "Kawa o yogosu beki de wa arimasen.", "We ought not to pollute the river."]
    ),
    "Stem + そう — it looks as if it is about to, or it looks like": pair(
      ["雨が降りそうです。", "あめがふりそうです。", "Ame ga furisō desu.", "It looks like it is about to rain."],
      ["この葉は枯れそうです。", "このははかれそうです。", "Kono ha wa karesō desu.", "This leaf looks as if it is about to wither."]
    ),
    "Plain + そうです — I heard that": pair(
      ["森が増えたそうです。", "もりがふえたそうです。", "Mori ga fueta sō desu.", "I heard that the forest has grown."],
      ["川がきれいになったそうです。", "かわがきれいになったそうです。", "Kawa ga kirei ni natta sō desu.", "I heard that the river has become clean."]
    ),
    "ようだ and らしい — it seems": pair(
      ["川がきれいになったようです。", "かわがきれいになったようです。", "Kawa ga kirei ni natta yō desu.", "It seems the river has become clean."],
      ["明日は雨が降るらしいです。", "あしたはあめがふるらしいです。", "Ashita wa ame ga furu rashii desu.", "It seems it will rain tomorrow."]
    ),
    "A thing is acted on": pair(
      ["この森は守られています。", "このもりはまもられています。", "Kono mori wa mamorarete imasu.", "This forest is being protected."],
      ["川がごみで汚されました。", "かわがごみでよごされました。", "Kawa ga gomi de yogosaremashita.", "The river was polluted by trash."]
    ),
    "A person receives the action": pair(
      ["私は先生に水の仕事を頼まれました。", "わたしはせんせいにみずのしごとをたのまれました。", "Watashi wa sensei ni mizu no shigoto o tanomaremashita.", "I was asked by the teacher to do the water work."],
      ["学生は先生に川の調査を頼まれました。", "がくせいはせんせいにかわのちょうさをたのまれました。", "Gakusei wa sensei ni kawa no chōsa o tanomaremashita.", "The student was asked by the teacher to survey the river."]
    ),
    "Passive + ています — the state is still true": pair(
      ["この木は保護されています。", "このきはほごされています。", "Kono ki wa hogo sarete imasu.", "This tree is still under protection."],
      ["古い道は閉じられています。", "ふるいみちはとじられています。", "Furui michi wa tojirarete imasu.", "The old path is still closed."]
    ),
    "Causative — make or let someone do": pair(
      ["子どもに木を植えさせます。", "こどもにきをうえさせます。", "Kodomo ni ki o uesasemasu.", "I have the children plant a tree."],
      ["学生に水を調べさせます。", "がくせいにみずをしらべさせます。", "Gakusei ni mizu o shirabesemasu.", "I have the students test the water."]
    ),
    "させてください — please let me": pair(
      ["この森の仕事に参加させてください。", "このもりのしごとにさんかさせてください。", "Kono mori no shigoto ni sanka sasete kudasai.", "Please let me join this forest work."],
      ["少し休ませてください。", "すこしやすませてください。", "Sukoshi yasumasete kudasai.", "Please let me rest a little."]
    ),
    "に Vてもらう — have someone do it for you": pair(
      ["専門家に川を調べてもらいます。", "せんもんかにかわをしらべてもらいます。", "Senmonka ni kawa o shirabete moraimasu.", "I have a specialist test the river for us."],
      ["友だちに苗を運んでもらいました。", "ともだちになえをはこんでもらいました。", "Tomodachi ni nae o hakonde moraimashita.", "I had my friend carry the seedlings."]
    ),
    "Vてくる — toward the present, or start to": pair(
      ["鳥が戻ってきました。", "とりがもどってきました。", "Tori ga modotte kimashita.", "The birds have come back."],
      ["空が明るくなってきました。", "そらがあかるくなってきました。", "Sora ga akaruku natte kimashita.", "The sky has started to brighten."]
    ),
    "Vていく — away from now, or continue into the future": pair(
      ["森は増えていきます。", "もりはふえていきます。", "Mori wa fuete ikimasu.", "The forest will keep growing."],
      ["ごみは減っていくでしょう。", "ごみはへっていくでしょう。", "Gomi wa hette iku deshō.", "The trash will probably keep decreasing."]
    ),
    "ようになる — reach a new state": pair(
      ["一人で木を植えられるようになりました。", "ひとりできをうえられるようになりました。", "Hitori de ki o uerareru yō ni narimashita.", "I reached the point where I can plant a tree alone."],
      ["水を自分で調べられるようになります。", "みずをじぶんでしらべられるようになります。", "Mizu o jibun de shiraberareru yō ni narimasu.", "You will reach the point where you can test the water yourself."]
    ),
    "お + stem + になります — respect": pair(
      ["先生は森をご覧になります。", "せんせいはもりをごらんになります。", "Sensei wa mori o goran ni narimasu.", "The teacher looks at the forest. ご覧になる is the respectful form."],
      ["お客様はこちらでお待ちになります。", "おきゃくさまはこちらでおまちになります。", "Okyakusama wa kochira de omachi ni narimasu.", "The guest waits here. お待ちになる is the respectful form."]
    ),
    "お + stem + します — humble": pair(
      ["水をお持ちします。", "みずをおもちします。", "Mizu o omochi shimasu.", "I will bring the water. Humble."],
      ["計画をご説明します。", "けいかくをごせつめいします。", "Keikaku o gosetsumei shimasu.", "I will explain the plan. Humble."]
    ),
    "Fixed lines you can memorize whole": pair(
      ["よろしくお願いいたします。", "よろしくおねがいいたします。", "Yoroshiku onegai itashimasu.", "I humbly ask for your goodwill."],
      ["いつもお世話になっております。", "いつもおせわになっております。", "Itsumo osewa ni natte orimasu.", "Thank you for your continued help."]
    ),
    "ご + noun + ください": pair(
      ["計画をご確認ください。", "けいかくをごかくにんください。", "Keikaku o gokakunin kudasai.", "Please check the plan."],
      ["森の仕事にご協力ください。", "もりのしごとにごきょうりょくください。", "Mori no shigoto ni gokyōryoku kudasai.", "Please cooperate with the forest work."]
    ),
    "お + stem + ください": pair(
      ["こちらでお待ちください。", "こちらでおまちください。", "Kochira de omachi kudasai.", "Please wait here."],
      ["水をお持ちください。", "みずをおもちください。", "Mizu o omochi kudasai.", "Please take the water with you."]
    ),
    "ていただけますと幸いです": pair(
      ["ご参加いただけますと幸いです。", "ごさんかいただけますとさいわいです。", "Gosanka itadakemasu to saiwai desu.", "I would be grateful if you could join."],
      ["ご確認いただけますと幸いです。", "ごかくにんいただけますとさいわいです。", "Gokakunin itadakemasu to saiwai desu.", "I would be grateful if you could check it."]
    ),
    "Noun modification, applied to paths": pair(
      ["森へ行く道は静かです。", "もりへいくみちはしずかです。", "Mori e iku michi wa shizuka desu.", "The path that goes to the forest is quiet."],
      ["水を守る方法を読みます。", "みずをまもるほうほうをよみます。", "Mizu o mamoru hōhō o yomimasu.", "I read the method that protects the water."]
    ),
    "という — called": pair(
      ["この活動は「森を守る会」と言います。", "このかつどうは「もりをまもるかい」といいます。", "Kono katsudō wa \"mori o mamoru kai\" to iimasu.", "This activity is called the Forest Protection Group."],
      ["これはリサイクルという仕事です。", "これはりさいくるというしごとです。", "Kore wa risaikuru to iu shigoto desu.", "This is the work called recycling."]
    ),
    "によって — depending on, or by": pair(
      ["季節によって、花が変わります。", "きせつによって、はながかわります。", "Kisetsu ni yotte, hana ga kawarimasu.", "The flowers change depending on the season."],
      ["この森は地域の人によって守られています。", "このもりはちいきのひとによってまもられています。", "Kono mori wa chiiki no hito ni yotte mamorarete imasu.", "This forest is protected by the local people."]
    ),
    "てみる in a report — I tried": pair(
      ["新しい水筒を使ってみました。", "あたらしいすいとうをつかってみました。", "Atarashii suitō o tsukatte mimashita.", "I tried the new water bottle."],
      ["北の森を歩いてみました。", "きたのもりをあるいてみました。", "Kita no mori o aruite mimashita.", "I tried walking the north forest."]
    ),
    "かどうか — whether": pair(
      ["この水がきれいかどうか、調べます。", "このみずがきれいかどうか、しらべます。", "Kono mizu ga kirei ka dō ka, shirabemasu.", "I will check whether this water is clean."],
      ["明日植えるかどうか、決めます。", "あしたうえるかどうか、きめます。", "Ashita ueru ka dō ka, kimemasu.", "I will decide whether we plant tomorrow."]
    ),
    "Embedded か — an inside question": pair(
      ["どこに木を植えるか、決めます。", "どこにきをうえるか、きめます。", "Doko ni ki o ueru ka, kimemasu.", "I will decide where to plant the tree."],
      ["水が足りるかを確認します。", "みずがたりるかをかくにんします。", "Mizu ga tariru ka o kakunin shimasu.", "I will confirm whether the water is enough."]
    ),
    "をください — I’ll take this": pair(
      ["この苗をください。", "このなえをください。", "Kono nae o kudasai.", "I will take this seedling."],
      ["再生紙をください。", "さいせいしをください。", "Saiseishi o kudasai.", "I will take the recycled paper."]
    ),
    "Stem + すぎる — too": pair(
      ["水を使いすぎます。", "みずをつかいすぎます。", "Mizu o tsukaisugimasu.", "I use too much water."],
      ["プラスチックが多すぎます。", "ぷらすちっくがおおすぎます。", "Purasuchikku ga ōsugimasu.", "There is too much plastic."]
    ),
    "が足ります / 足りません": pair(
      ["今日の水は足ります。", "きょうのみずはたります。", "Kyō no mizu wa tarimasu.", "Today's water is enough."],
      ["電気が足りません。", "でんきがたりません。", "Denki ga tarimasen.", "There is not enough electricity."]
    ),
    "んです / のです": pair(
      ["水が少ないんです。", "みずがすくないんです。", "Mizu ga sukunai n desu.", "The thing is, there is little water."],
      ["どうして自転車で行くんですか。", "どうしてじてんしゃでいくんですか。", "Dōshite jitensha de iku n desu ka.", "Why is it that you go by bicycle?"]
    ),
    "くて and で — join descriptions": pair(
      ["森は大きくて、静かです。", "もりはおおきくて、しずかです。", "Mori wa ōkikute, shizuka desu.", "The forest is large and quiet."],
      ["川はきれいで、冷たいです。", "かわはきれいで、つめたいです。", "Kawa wa kirei de, tsumetai desu.", "The river is clean and cold."]
    ),
    "て、すみません — the reason for an apology": pair(
      ["水を汚して、すみません。", "みずをよごして、すみません。", "Mizu o yogoshite, sumimasen.", "I am sorry for polluting the water."],
      ["遅れて、すみません。", "おくれて、すみません。", "Okurete, sumimasen.", "I am sorry for being late."]
    ),
    "だけ and しか〜ない": pair(
      ["今日は水だけ使います。", "きょうはみずだけつかいます。", "Kyō wa mizu dake tsukaimasu.", "Today I use only water."],
      ["この森にしか、その鳥はいません。", "このもりにしか、そのとりはいません。", "Kono mori ni shika, sono tori wa imasen.", "That bird lives only in this forest."]
    ),
    "や … など — an incomplete list": pair(
      ["森や川などを守ります。", "もりやかわなどをまもります。", "Mori ya kawa nado o mamorimasu.", "We protect the forest, the river, and so on."],
      ["びんや紙などを再利用します。", "びんやかみなどをさいりようします。", "Bin ya kami nado o sairiyō shimasu.", "We reuse bottles, paper, and the like."]
    ),
    "ね, よ, and よね": pair(
      ["きれいですね。", "きれいですね。", "Kirei desu ne.", "It is clean, isn't it."],
      ["水は大切ですよね。", "みずはたいせつですよね。", "Mizu wa taisetsu desu yo ne.", "Water is important, don't you agree."]
    ),
    "Stem + 方 — the way of doing": pair(
      ["ごみの分け方を教えてください。", "ごみのわけかたをおしえてください。", "Gomi no wakekata o oshiete kudasai.", "Please teach me the way to sort trash."],
      ["木の植え方は簡単です。", "きのうえかたはかんたんです。", "Ki no uekata wa kantan desu.", "The way to plant a tree is simple."]
    ),
    "Stem + やすい / にくい": pair(
      ["この瓶は使いやすいです。", "このびんはつかいやすいです。", "Kono bin wa tsukaiyasui desu.", "This bottle is easy to use."],
      ["この袋は分けにくいです。", "このふくろはわけにくいです。", "Kono fukuro wa wakenikui desu.", "This bag is hard to sort."]
    ),
    "方 and やすい together": pair(
      ["この紙は再利用しやすくて、分け方も簡単です。", "このかみはさいりようしやすくて、わけかたもかんたんです。", "Kono kami wa sairiyō shiyasukute, wakekata mo kantan desu.", "This paper is easy to reuse, and the way of sorting it is simple too."],
      ["植え方が分かりやすくて、苗も植えやすいです。", "うえかたがわかりやすくて、なえもうえやすいです。", "Uekata ga wakariyasukute, nae mo ueyasui desu.", "The way of planting is easy to follow, and the seedlings are easy to plant."]
    ),
    "たことがある — have the experience": pair(
      ["森に行ったことがあります。", "もりにいったことがあります。", "Mori ni itta koto ga arimasu.", "I have been to the forest."],
      ["川で泳いだことがあります。", "かわでおよいだことがあります。", "Kawa de oyoida koto ga arimasu.", "I have swum in the river."]
    ),
    "ことがある — sometimes happens": pair(
      ["夏は雨が降ることがあります。", "なつはあめがふることがあります。", "Natsu wa ame ga furu koto ga arimasu.", "In summer, it sometimes rains."],
      ["鳥が窓に来ることがあります。", "とりがまどにくることがあります。", "Tori ga mado ni kuru koto ga arimasu.", "A bird sometimes comes to the window."]
    ),
    "のに — even though": pair(
      ["水が少ないのに、出しっぱなしです。", "みずがすくないのに、だしっぱなしです。", "Mizu ga sukunai noni, dashippanashi desu.", "Even though water is scarce, it is left running."],
      ["寒いのに、窓が開いています。", "さむいのに、まどがあいています。", "Samui noni, mado ga aite imasu.", "Even though it is cold, the window is open."]
    ),
    "～について — about": pair(
      ["森の再生について話します。", "もりさいせいについてはなします。", "Mori no saisei ni tsuite hanashimasu.", "We will talk about restoring the forest."],
      ["川の水について確認します。", "かわのみずについてかくにんします。", "Kawa no mizu ni tsuite kakunin shimasu.", "I will confirm the matter of the river water."]
    ),
    "AをBと呼びます — we call A “B”": pair(
      ["この森を「水源の森」と呼びます。", "このもりを「すいげんのもり」とよびます。", "Kono mori o \"suigen no mori\" to yobimasu.", "We call this forest the water-source forest."],
      ["この活動をリサイクルと呼びます。", "このかつどうをりさいくるとよびます。", "Kono katsudō o risaikuru to yobimasu.", "We call this activity recycling."]
    ),
    "Aの役割はBです — A’s role is B": pair(
      ["森の役割は水を守ることです。", "もりやくわりはみずをまもることです。", "Mori no yakuwari wa mizu o mamoru koto desu.", "The forest's role is to protect the water."],
      ["私の役割は木を植えることです。", "わたしのやくわりはきをうえることです。", "Watashi no yakuwari wa ki o ueru koto desu.", "My role is to plant the trees."]
    ),
    "本日は～ — naming the meeting": pair(
      ["本日は森の再生についてです。", "ほんじつはもりさいせいについてです。", "Honjitsu wa mori no saisei ni tsuite desu.", "Today's meeting is about restoring the forest."],
      ["本日は水の使い方です。", "ほんじつはみずのつかいかたです。", "Honjitsu wa mizu no tsukaikata desu.", "Today's meeting is about how we use water."]
    ),
    "～させていただきます — I will humbly do it": pair(
      ["計画をご説明させていただきます。", "けいかくをごせつめいさせていただきます。", "Keikaku o gosetsumei sasete itadakimasu.", "I will humbly explain the plan."],
      ["明日、木を植えさせていただきます。", "あした、きをうえさせていただきます。", "Ashita, ki o uesasete itadakimasu.", "I will humbly plant the trees tomorrow."]
    ),
    "～から始めて、～で締めます": pair(
      ["水の話から始めて、森の話で締めます。", "みずのはなしからはじめて、もりのはなしでしめます。", "Mizu no hanashi kara hajimete, mori no hanashi de shimemasu.", "We start with the water and close with the forest."],
      ["現状から始めて、提案で締めます。", "げんじょうからはじめて、ていあんでしめます。", "Genjō kara hajimete, teian de shimemasu.", "We start from the current state and close with the proposal."]
    ),
    "～てほしいです — I want you to": pair(
      ["水を守ってほしいです。", "みずをまもってほしいです。", "Mizu o mamotte hoshii desu.", "I want you to protect the water."],
      ["ごみを減らしてほしいです。", "ごみをへらしてほしいです。", "Gomi o herashite hoshii desu.", "I want you to reduce the trash."]
    ),
    "今は～ています — this is what happens now": pair(
      ["今は森が減っています。", "いまはもりがへっています。", "Ima wa mori ga hette imasu.", "Right now, the forest is shrinking."],
      ["今は水を節約しています。", "いまはみずをせつやくしています。", "Ima wa mizu o setsuyaku shite imasu.", "Right now, we are saving water."]
    ),
    "～回 / ～件 — how often and how many": pair(
      ["月に二回、川を見ます。", "つきににかい、かわをみます。", "Tsuki ni nikai, kawa o mimasu.", "We look at the river twice a month."],
      ["質問は三件あります。", "しつもんはさんけんあります。", "Shitsumon wa sanken arimasu.", "There are three questions."]
    ),
    "つまり～ということですね — so you mean": pair(
      ["つまり、森を守るということですね。", "つまり、もりをまもるということですね。", "Tsumari, mori o mamoru to iu koto desu ne.", "So you mean we protect the forest."],
      ["つまり、水を大切にするということですね。", "つまり、みずをたいせつにするということですね。", "Tsumari, mizu o taisetsu ni suru to iu koto desu ne.", "So you mean we treat water as precious."]
    ),
    "具体的には — specifically": pair(
      ["具体的には、びんを再利用します。", "ぐたいてきには、びんをさいりようします。", "Gutaiteki ni wa, bin o sairiyō shimasu.", "Specifically, we reuse the bottles."],
      ["具体的には、月に百本植えます。", "ぐたいてきには、つきにひゃっぽんうえます。", "Gutaiteki ni wa, tsuki ni hyappon uemasu.", "Specifically, we plant one hundred trees a month."]
    ),
    "～場合は — when that case happens": pair(
      ["雨の場合は、室内でびんを洗います。", "あめのばあいは、しつないでびんをあらいます。", "Ame no baai wa, shitsunai de bin o araimasu.", "When it rains, we wash bottles indoors."],
      ["水が少ない場合は、節約します。", "みずがすくないばあいは、せつやくします。", "Mizu ga sukunai baai wa, setsuyaku shimasu.", "When water is scarce, we save it."]
    ),
    "～という理解で合っていますか — is this the right reading?": pair(
      ["森を守るという理解で合っていますか。", "もりをまもるというりかいであっていますか。", "Mori o mamoru to iu rikai de atte imasu ka.", "Is the reading that we protect the forest correct?"],
      ["来月植えるという理解で合っていますか。", "らいげつうえるというりかいであっていますか。", "Raigetsu ueru to iu rikai de atte imasu ka.", "Is the reading that we plant next month correct?"]
    ),
    "認識が違います — that is not our reading": pair(
      ["認識が違います。森はまだ減っています。", "にんしきがちがいます。もりはまだへっています。", "Ninshiki ga chigaimasu. Mori wa mada hette imasu.", "That reading is different. The forest is still shrinking."],
      ["認識が違います。水はまだ足りません。", "にんしきがちがいます。みずはまだたりません。", "Ninshiki ga chigaimasu. Mizu wa mada tarimasen.", "That reading is different. The water is still not enough."]
    ),
    "確認させてください — let me confirm": pair(
      ["数字を確認させてください。", "すうじをかくにんさせてください。", "Sūji o kakunin sasete kudasai.", "Let me confirm the numbers."],
      ["植える場所を確認させてください。", "うえるばしょをかくにんさせてください。", "Ueru basho o kakunin sasete kudasai.", "Let me confirm the planting place."]
    ),
    "今回の範囲は～です — this round covers": pair(
      ["今回の範囲は川の掃除です。", "こんかいのはんいはかわのそうじです。", "Konkai no han'i wa kawa no sōji desu.", "This round covers cleaning the river."],
      ["今回の範囲は北の森です。", "こんかいのはんいはきたのもりです。", "Konkai no han'i wa kita no mori desu.", "This round covers the north forest."]
    ),
    "～は対象外です — that waits outside": pair(
      ["海は対象外です。", "うみはたいしょうがいです。", "Umi wa taishōgai desu.", "The sea is outside this round."],
      ["町の公園は対象外です。", "まちのこうえんはたいしょうがいです。", "Machi no kōen wa taishōgai desu.", "The town park is outside this round."]
    ),
    "～は次回に回します — we schedule it for the next round": pair(
      ["南の森は次回に回します。", "みなみのもりはじかいにまわします。", "Minami no mori wa jikai ni mawashimasu.", "We schedule the south forest for the next round."],
      ["この提案は次回に回します。", "このていあんはじかいにまわします。", "Kono teian wa jikai ni mawashimasu.", "We schedule this proposal for the next round."]
    ),
    "～と決まりました — it was decided that": pair(
      ["来月植えると決まりました。", "らいげつうえるときまりました。", "Raigetsu ueru to kimarimashita.", "It was decided that we plant next month."],
      ["びんを再利用すると決まりました。", "びんをさいりようするときまりました。", "Bin o sairiyō suru to kimarimashita.", "It was decided that we reuse the bottles."]
    ),
    "持ち帰りは～です — the item to take back is": pair(
      ["持ち帰りは水の調査です。", "もちかえりはみずのちょうさです。", "Mochikaeri wa mizu no chōsa desu.", "The item to take back is the water survey."],
      ["持ち帰りは苗の数です。", "もちかえりはなえのかずです。", "Mochikaeri wa nae no kazu desu.", "The item to take back is the number of seedlings."]
    ),
    "次は～に送ります — the next delivery": pair(
      ["次の報告は金曜に送ります。", "つぎのほうこくはきんようにおくります。", "Tsugi no hōkoku wa kin'yō ni okurimasu.", "I will send the next report on Friday."],
      ["次の苗は月曜に送ります。", "つぎのなえはげつようにおくります。", "Tsugi no nae wa getsuyō ni okurimasu.", "I will send the next seedlings on Monday."]
    ),
    "前提は～です — the assumption is": pair(
      ["前提は水が足りていることです。", "ぜんていはみずがたりていることです。", "Zentei wa mizu ga tarite iru koto desu.", "The assumption is that the water is sufficient."],
      ["前提は森が残っていることです。", "ぜんていはもりがのこっていることです。", "Zentei wa mori ga nokotte iru koto desu.", "The assumption is that the forest is still there."]
    ),
    "～人日 — person-days": pair(
      ["この仕事は五人日です。", "このしごとはごにんにちです。", "Kono shigoto wa goninnichi desu.", "This work is five person-days."],
      ["調査は二人日です。", "ちょうさはににんにちです。", "Chōsa wa nininnichi desu.", "The survey is two person-days."]
    ),
    "税別で～円です — the price before tax": pair(
      ["苗は税別で三百円です。", "なえはぜいべつでさんびゃくえんです。", "Nae wa zeibetsu de sanbyaku en desu.", "The seedling is 300 yen before tax."],
      ["作業は税別で一万円です。", "さぎょうはぜいべつでいちまんえんです。", "Sagyō wa zeibetsu de ichiman en desu.", "The work is 10,000 yen before tax."]
    ),
    "～までに終わらせます — I will have it finished by": pair(
      ["植え付けを金曜までに終わらせます。", "うえつけをきんようまでにおわらせます。", "Uetsuke o kin'yō made ni owarasemasu.", "I will have the planting finished by Friday."],
      ["調査を春までに終わらせます。", "ちょうさをはるまでにおわらせます。", "Chōsa o haru made ni owarasemasu.", "I will have the survey finished by spring."]
    ),
    "中間確認は～です — the check in the middle is": pair(
      ["中間確認は水曜です。", "ちゅうかんかくにんはすいようです。", "Chūkan kakunin wa suiyō desu.", "The midpoint check is Wednesday."],
      ["中間確認は水の検査です。", "ちゅうかんかくにんはみずのけんさです。", "Chūkan kakunin wa mizu no kensa desu.", "The midpoint check is the water test."]
    ),
    "～てから — after that, the next step": pair(
      ["調べてから、植えます。", "しらべてから、うえます。", "Shirabete kara, uemasu.", "After we investigate, we plant."],
      ["洗ってから、再利用します。", "あらってから、さいりようします。", "Aratte kara, sairiyō shimasu.", "After we wash it, we reuse it."]
    ),
    "～のは難しいです — doing that is difficult": pair(
      ["一日で全部植えるのは難しいです。", "いちにちでぜんぶうえるのはむずかしいです。", "Ichinichi de zenbu ueru no wa muzukashii desu.", "Planting all of them in one day is difficult."],
      ["プラスチックをゼロにするのは難しいです。", "ぷらすちっくをぜろにするのはむずかしいです。", "Purasuchikku o zero ni suru no wa muzukashii desu.", "Bringing plastic to zero is difficult."]
    ),
    "代わりに～ではどうですか — how about this instead": pair(
      ["代わりに、半分だけ植えてはどうですか。", "かわりに、はんぶんだけうえてはどうですか。", "Kawari ni, hanbun dake uete wa dō desu ka.", "How about planting only half, instead?"],
      ["代わりに、水筒を使ってはどうですか。", "かわりに、すいとうをつかってはどうですか。", "Kawari ni, suitō o tsukatte wa dō desu ka.", "How about using a water bottle, instead?"]
    ),
    "段階的に～ — in stages": pair(
      ["段階的に木を増やします。", "だんかいてきにきをふやします。", "Dankaiteki ni ki o fuyashimasu.", "We increase the trees in stages."],
      ["段階的にプラスチックを減らします。", "だんかいてきにぷらすちっくをへらします。", "Dankaiteki ni purasuchikku o herashimasu.", "We reduce plastic in stages."]
    ),
    "承知しました。～で進めます — understood, and here is the path": pair(
      ["承知しました。森の計画で進めます。", "しょうちしました。もりけいかくですすめます。", "Shōchi shimashita. Mori no keikaku de susumemasu.", "Understood. We proceed with the forest plan."],
      ["承知しました。水の節約で進めます。", "しょうちしました。みずのせつやくですすめます。", "Shōchi shimashita. Mizu no setsuyaku de susumemasu.", "Understood. We proceed by saving water."]
    ),
    "条件は～ことです — the condition is that": pair(
      ["条件は水を汚さないことです。", "じょうけんはみずをよごさないことです。", "Jōken wa mizu o yogosanai koto desu.", "The condition is that we do not pollute the water."],
      ["条件は毎月報告することです。", "じょうけんはまいげつほうこくすることです。", "Jōken wa maigetsu hōkoku suru koto desu.", "The condition is that we report every month."]
    ),
    "～に一任します — we leave that to": pair(
      ["植え方は現場に一任します。", "うえかたはげんばにいちにんします。", "Uekata wa genba ni ichinin shimasu.", "We leave the way of planting to the site."],
      ["日程は森の担当に一任します。", "にっていはもりたんとうにいちにんします。", "Nittei wa mori no tantō ni ichinin shimasu.", "We leave the schedule to the forest lead."]
    ),
    "今回は見送らせてください — please let this wait": pair(
      ["今回は海の計画を見送らせてください。", "こんかいはうみのけいかくをみおくらせてください。", "Konkai wa umi no keikaku o miokurasete kudasai.", "Please let the sea plan wait this time."],
      ["今回は新しい袋を見送らせてください。", "こんかいはあたらしいふくろをみおくらせてください。", "Konkai wa atarashii fukuro o miokurasete kudasai.", "Please let the new bag wait this time."]
    ),
    "～れば対応できます — if that holds, we can do it": pair(
      ["水が足りれば対応できます。", "みずがたりればたいおうできます。", "Mizu ga tarireba taiō dekimasu.", "If the water is enough, we can do it."],
      ["人が集まれば対応できます。", "ひとがあつまればたいおうできます。", "Hito ga atsumareba taiō dekimasu.", "If the people gather, we can do it."]
    ),
    "代案は～です — the stand-in is": pair(
      ["代案は北の森です。", "だいあんはきたのもりです。", "Daian wa kita no mori desu.", "The stand-in is the north forest."],
      ["代案はびんの再利用です。", "だいあんはびんさいりようです。", "Daian wa bin no sairiyō desu.", "The stand-in is reusing the bottles."]
    ),
    "～させていただきます — I will humbly do this": pair(
      ["明日ご連絡させていただきます。", "あしたごれんらくさせていただきます。", "Ashita gorenraku sasete itadakimasu.", "I will humbly contact you tomorrow."],
      ["計画をお送りさせていただきます。", "けいかくをおおくりさせていただきます。", "Keikaku o ookuri sasete itadakimasu.", "I will humbly send the plan."]
    ),
    "ご検討ください — please consider it": pair(
      ["この森の計画をご検討ください。", "このもりけいかくをごけんとうください。", "Kono mori no keikaku o gokentō kudasai.", "Please consider this forest plan."],
      ["水の提案をご検討ください。", "みずのていあんをごけんとうください。", "Mizu no teian o gokentō kudasai.", "Please consider the water proposal."]
    ),
    "ご返信をお待ちしております — I am waiting for your reply": pair(
      ["ご返信をお待ちしております。", "ごへんしんをおまちしております。", "Gohenshin o omachi shite orimasu.", "I am waiting for your reply."],
      ["ご確認をお待ちしております。", "ごかくにんをおまちしております。", "Gokakunin o omachi shite orimasu.", "I am waiting for your confirmation."]
    ),
    "結論から申します — I will start from the conclusion": pair(
      ["結論から申します。森を残します。", "けつろんからもうします。もりをのこします。", "Ketsuron kara mōshimasu. Mori o nokoshimasu.", "I will start from the conclusion. We keep the forest."],
      ["結論から申します。びんに変えます。", "けつろんからもうします。びんにかえます。", "Ketsuron kara mōshimasu. Bin ni kaemasu.", "I will start from the conclusion. We switch to bottles."]
    ),
    "～より～の方が — one option over another": pair(
      ["車より自転車の方が静かです。", "くるまよりじてんしゃのほうがしずかです。", "Kuruma yori jitensha no hō ga shizuka desu.", "A bicycle is quieter than a car."],
      ["新しいびんより水筒の方がいいです。", "あたらしいびんよりすいとうのほうがいいです。", "Atarashii bin yori suitō no hō ga ii desu.", "A water bottle is better than a new jar."]
    ),
    "～をお願いいたします — I humbly ask": pair(
      ["ご確認をお願いいたします。", "ごかくにんをおねがいいたします。", "Gokakunin o onegai itashimasu.", "I humbly ask you to check it."],
      ["木を植えることをお願いいたします。", "きをうえることをおねがいいたします。", "Ki o ueru koto o onegai itashimasu.", "I humbly ask that we plant the trees."]
    ),
    "画面の流れは～です — the flow of the screen is": pair(
      ["画面の流れは、森、川、次の作業です。", "がめんのながれは、もり、かわ、つぎのさぎょうです。", "Gamen no nagare wa, mori, kawa, tsugi no sagyō desu.", "The screen flow is forest, river, then the next task."],
      ["画面の流れは三つの画面です。", "がめんのながれはみっつのがめんです。", "Gamen no nagare wa mittsu no gamen desu.", "The screen flow is three screens."]
    ),
    "～すると、～になります — when you do this, it becomes": pair(
      ["ここを押すと、地図が森になります。", "ここをおすと、ちずがもりになります。", "Koko o osu to, chizu ga mori ni narimasu.", "When you press here, the map becomes the forest."],
      ["保存すると、水の数が見えます。", "ほぞんすると、みずのかずがみえます。", "Hozon suru to, mizu no kazu ga miemasu.", "When you save, the water count appears."]
    ),
    "入力欄に～を入れます — you put this in the field": pair(
      ["入力欄に本数を入れます。", "にゅうりょくらんにほんすうをいれます。", "Nyūryokuran ni honsū o iremasu.", "You put the number of trees in the field."],
      ["入力欄に川の名前を入れます。", "にゅうりょくらんにかわのなまえをいれます。", "Nyūryokuran ni kawa no namae o iremasu.", "You put the river's name in the field."]
    ),
    "今からお見せします — I will show you now": pair(
      ["今から森の画面をお見せします。", "いまからもりのがめんをおみせします。", "Ima kara mori no gamen o omise shimasu.", "I will show you the forest screen now."],
      ["今から水のグラフをお見せします。", "いまからみずのぐらふをおみせします。", "Ima kara mizu no gurafu o omise shimasu.", "I will show you the water chart now."]
    ),
    "～をクリックすると — when you click": pair(
      ["森をクリックすると、詳細が出ます。", "もりをクリックすると、しょうさいがでます。", "Mori o kurikku suru to, shōsai ga demasu.", "When you click the forest, the detail appears."],
      ["川をクリックすると、水質が出ます。", "かわをクリックすると、すいしつがでます。", "Kawa o kurikku suru to, suishitsu ga demasu.", "When you click the river, the water quality appears."]
    ),
    "ご質問はありますか — do you have a question?": pair(
      ["ご質問はありますか。", "ごしつもんはありますか。", "Goshitsumon wa arimasu ka.", "Do you have a question?"],
      ["水についてご質問はありますか。", "みずについてごしつもんはありますか。", "Mizu ni tsuite goshitsumon wa arimasu ka.", "Do you have a question about the water?"]
    ),
    "～ているところです — in the middle of it": pair(
      ["今、木を植えているところです。", "いま、きをうえているところです。", "Ima, ki o uete iru tokoro desu.", "We are in the middle of planting the trees."],
      ["今、水を調べているところです。", "いま、みずをしらべているところです。", "Ima, mizu o shirabete iru tokoro desu.", "We are in the middle of testing the water."]
    ),
    "～たばかりです — it has just finished": pair(
      ["植えたばかりです。", "うえたばかりです。", "Ueta bakari desu.", "We have just planted it."],
      ["報告したばかりです。", "ほうこくしたばかりです。", "Hōkoku shita bakari desu.", "I have just sent the report."]
    ),
    "～るところです — just about to": pair(
      ["今から植えるところです。", "いまからうえるところです。", "Ima kara ueru tokoro desu.", "We are just about to plant."],
      ["今から報告を出すところです。", "いまからほうこくをだすところです。", "Ima kara hōkoku o dasu tokoro desu.", "I am just about to send the report."]
    ),
    "～割終わっています — this share is finished": pair(
      ["七割終わっています。", "ななわりおわっています。", "Nanawari owatte imasu.", "Seven tenths of it is finished."],
      ["森の調査は五割終わっています。", "もりちょうさはごわりおわっています。", "Mori no chōsa wa gowari owatte imasu.", "Half of the forest survey is finished."]
    ),
    "残りは～です — what is left is": pair(
      ["残りは南の区域です。", "のこりはみなみのくいきです。", "Nokori wa minami no kuiki desu.", "What is left is the south area."],
      ["残りは水の検査です。", "のこりはみずのけんさです。", "Nokori wa mizu no kensa desu.", "What is left is the water test."]
    ),
    "見通しは～です — the outlook is": pair(
      ["見通しは春に終わります。", "みとおしははるにおわります。", "Mitōshi wa haru ni owarimasu.", "The outlook is that it ends in spring."],
      ["見通しはよいです。", "みとおしはよいです。", "Mitōshi wa yoi desu.", "The outlook is good."]
    ),
    "遅延の理由は～です — the reason for the delay is": pair(
      ["遅延の理由は雨です。", "ちえんのりゆうはあめです。", "Chien no riyū wa ame desu.", "The reason for the delay is the rain."],
      ["遅延の理由は水が少ないことです。", "ちえんのりゆうはみずがすくないことです。", "Chien no riyū wa mizu ga sukunai koto desu.", "The reason for the delay is that water is scarce."]
    ),
    "新しい日付は～です — the new date is": pair(
      ["新しい日付は四月十日です。", "あたらしいひづけはしがつとおかです。", "Atarashii hidzuke wa shigatsu tōka desu.", "The new date is April 10."],
      ["新しい日付は来月の月曜です。", "あたらしいひづけはらいげつのげつようです。", "Atarashii hidzuke wa raigetsu no getsuyō desu.", "The new date is Monday of next month."]
    ),
    "～で取り戻します — we will win it back by": pair(
      ["土曜の作業で取り戻します。", "どようのさぎょうでとりもどします。", "Doyō no sagyō de torimodoshimasu.", "We will win the time back with Saturday's work."],
      ["人数を増やして取り戻します。", "にんずうをふやしてとりもどします。", "Ninzū o fuyashite torimodoshimasu.", "We will win it back by adding people."]
    ),
    "～ているうちに — while that is still going on": pair(
      ["明るいうちに木を植えます。", "あかるいうちにきをうえます。", "Akarui uchi ni ki o uemasu.", "We plant the trees while it is still light."],
      ["水があるうちにためます。", "みずがあるうちにためます。", "Mizu ga aru uchi ni tamemasu.", "We store water while we still have it."]
    ),
    "～ないうちに — before that happens": pair(
      ["乾かないうちに水をやります。", "かわかないうちにみずをやります。", "Kawakanai uchi ni mizu o yarimasu.", "I water the plants before the soil dries."],
      ["暗くならないうちに帰ります。", "くらくならないうちにかえります。", "Kuraku naranai uchi ni kaerimasu.", "We go home before it gets dark."]
    ),
    "～あいだに — during that span": pair(
      ["夏のあいだに百本植えます。", "なつのあいだにひゃっぽんうえます。", "Natsu no aida ni hyappon uemasu.", "We plant one hundred trees during the summer."],
      ["会議のあいだに電気を消します。", "かいぎのあいだにでんきをけします。", "Kaigi no aida ni denki o keshimasu.", "We turn the lights off during the meeting."]
    ),
    "変更内容は～です — what is changing is": pair(
      ["変更内容は植える場所です。", "へんこうないようはうえるばしょです。", "Henkō naiyō wa ueru basho desu.", "What is changing is the planting place."],
      ["変更内容は水の量です。", "へんこうないようはみずのりょうです。", "Henkō naiyō wa mizu no ryō desu.", "What is changing is the amount of water."]
    ),
    "影響は～です — the effect is": pair(
      ["影響は南の森だけです。", "えいきょうはみなみのもりだけです。", "Eikyō wa minami no mori dake desu.", "The effect is only on the south forest."],
      ["影響は来月の作業です。", "えいきょうはらいげつのさぎょうです。", "Eikyō wa raigetsu no sagyō desu.", "The effect is on next month's work."]
    ),
    "再見積してから受諾します — we accept after the new estimate": pair(
      ["再見積してから受諾します。", "さいみつもりしてからじゅだくします。", "Sai-mitsumori shite kara judaku shimasu.", "We accept after the new estimate."],
      ["水の費用を再見積してから受諾します。", "みずのひようをさいみつもりしてからじゅだくします。", "Mizu no hiyō o sai-mitsumori shite kara judaku shimasu.", "We accept the water cost after the new estimate."]
    ),
    "事象は～です — what we observed is": pair(
      ["事象は川が濁ったことです。", "じしょうはかわがにごったことです。", "Jishō wa kawa ga nigotta koto desu.", "What we observed is that the river turned cloudy."],
      ["事象は木が枯れたことです。", "じしょうはきがかれたことです。", "Jishō wa ki ga kareta koto desu.", "What we observed is that a tree withered."]
    ),
    "暫定は～、恒久は～ — for now, and for good": pair(
      ["暫定は水を止めます。恒久は管を変えます。", "ざんていはみずをとめます。こうきゅうはかんをかえます。", "Zantei wa mizu o tomemasu. Kōkyū wa kan o kaemasu.", "For now we stop the water. For good, we change the pipe."],
      ["暫定はシートです。恒久は植林です。", "ざんていはしーとです。こうきゅうはしょくりんです。", "Zantei wa shīto desu. Kōkyū wa shokurin desu.", "For now, a cover. For good, planting."]
    ),
    "～ても再現します — it still happens even if": pair(
      ["フィルターを変えても、濁りは再現します。", "ふぃるたーをかえても、にごりはさいげんします。", "Firutā o kaete mo, nigori wa saigen shimasu.", "Even if we change the filter, the cloudiness still happens."],
      ["窓を閉めても、音は再現します。", "まどをしめても、おとはさいげんします。", "Mado o shimete mo, oto wa saigen shimasu.", "Even if we shut the window, the sound still happens."]
    ),
    "～させられる / ～される — be made to": pair(
      ["予定より多く植えさせられます。", "よていよりおおくうえさせられます。", "Yotei yori ōku uesaseraremasu.", "We are made to plant more than planned."],
      ["古い木が切られました。", "ふるいきがきられました。", "Furui ki ga kiraremashita.", "The old tree was cut."]
    ),
    "しわ寄せは～に来ています — the burden is landing on": pair(
      ["しわ寄せは現場に来ています。", "しわよせはげんばにきています。", "Shiwayose wa genba ni kite imasu.", "The burden is landing on the site."],
      ["しわ寄せは水の担当に来ています。", "しわよせはみずのたんとうにきています。", "Shiwayose wa mizu no tantō ni kite imasu.", "The burden is landing on the water lead."]
    ),
    "決定権は～にあります。選択肢は二つです — the choice sits here": pair(
      ["決定権は森の担当にあります。選択肢は二つです。", "けっていけんはもりたんとうにあります。せんたくしはふたつです。", "Ketteiken wa mori no tantō ni arimasu. Sentakushi wa futatsu desu.", "The decision sits with the forest lead. There are two choices."],
      ["決定権は会議にあります。選択肢は植えるか、待つかです。", "けっていけんはかいぎにあります。せんたくしはうえるか、まつかです。", "Ketteiken wa kaigi ni arimasu. Sentakushi wa ueru ka, matsu ka desu.", "The decision sits with the meeting. The choices are to plant or to wait."]
    ),
    "受入条件は～です — the condition for acceptance is": pair(
      ["受入条件は水がきれいなことです。", "うけいれじょうけんはみずがきれいなことです。", "Ukeire jōken wa mizu ga kirei na koto desu.", "The condition for acceptance is that the water is clean."],
      ["受入条件は百本植えてあることです。", "うけいれじょうけんはひゃっぽんうえてあることです。", "Ukeire jōken wa hyappon uete aru koto desu.", "The condition for acceptance is that one hundred trees are planted."]
    ),
    "合格です / 不合格です — it passes, it fails": pair(
      ["この区域は合格です。", "このくいきはごうかくです。", "Kono kuiki wa gōkaku desu.", "This area passes."],
      ["南の森は不合格です。", "みなみのもりはふごうかくです。", "Minami no mori wa fugōkaku desu.", "The south forest fails."]
    ),
    "条件付きで合格にします — we pass it with a condition": pair(
      ["条件付きで合格にします。水の検査が残っています。", "じょうけんつきでごうかくにします。みずのけんさがのこっています。", "Jōken-tsuki de gōkaku ni shimasu. Mizu no kensa ga nokotte imasu.", "We pass it with a condition. The water test is still left."],
      ["条件付きで合格にします。来月もう一度見ます。", "じょうけんつきでごうかくにします。らいげつもういちどみます。", "Jōken-tsuki de gōkaku ni shimasu. Raigetsu mō ichido mimasu.", "We pass it with a condition. We look again next month."]
    ),
    "停止時間は～です — the stop lasts": pair(
      ["停止時間は二時間です。", "ていしじかんはにじかんです。", "Teishi jikan wa nijikan desu.", "The stop lasts two hours."],
      ["停止時間は朝の一時間です。", "ていしじかんはあさのいちじかんです。", "Teishi jikan wa asa no ichijikan desu.", "The stop lasts one hour in the morning."]
    ),
    "～たら、切り戻します — if that happens, we put it back": pair(
      ["水が濁ったら、切り戻します。", "みずがにごったら、きりもどします。", "Mizu ga nigottara, kirimodoshimasu.", "If the water turns cloudy, we put it back."],
      ["エラーが出たら、切り戻します。", "えらーがでたら、きりもどします。", "Erā ga detara, kirimodoshimasu.", "If an error appears, we put it back."]
    ),
    "反映後に～を確認します — after it is applied, we check": pair(
      ["反映後に水質を確認します。", "はんえいごにすいしつをかくにんします。", "Han'ei go ni suishitsu o kakunin shimasu.", "After it is applied, we check the water quality."],
      ["反映後に本数を確認します。", "はんえいごにほんすうをかくにんします。", "Han'ei go ni honsū o kakunin shimasu.", "After it is applied, we check the number of trees."]
    ),
    "問い合わせは～に入ります — a question comes in to": pair(
      ["問い合わせは窓口に入ります。", "といあわせはまどぐちにはいります。", "Toiawase wa madoguchi ni hairimasu.", "A question comes in to the contact desk."],
      ["水の質問はメールに入ります。", "みずのしつもんはめーるにはいります。", "Mizu no shitsumon wa mēru ni hairimasu.", "A question about water comes in by email."]
    ),
    "対応期限は～です — the answer is due by": pair(
      ["対応期限は金曜です。", "たいおうきげんはきんようです。", "Taiō kigen wa kin'yō desu.", "The answer is due by Friday."],
      ["対応期限は三日以内です。", "たいおうきげんはみっかいないです。", "Taiō kigen wa mikka inai desu.", "The answer is due within three days."]
    ),
    "既知なら～、未知なら～ — if we have seen it, if we have not": pair(
      ["既知なら手順を送ります。未知なら現地へ行きます。", "きちならてじゅんをおくります。みちならげんちへいきます。", "Kichi nara tejun o okurimasu. Michi nara genchi e ikimasu.", "If we have seen it, we send the steps. If we have not, we go to the site."],
      ["既知なら今日答えます。未知なら調べます。", "きちならきょうこたえます。みちならしらべます。", "Kichi nara kyō kotaemasu. Michi nara shirabemasu.", "If we have seen it, we answer today. If we have not, we investigate."]
    ),
    "申し訳ございません — I am at fault": pair(
      ["水を汚してしまい、申し訳ございません。", "みずをよごしてしまい、もうしわけございません。", "Mizu o yogoshite shimai, mōshiwake gozaimasen.", "I polluted the water. I am at fault."],
      ["遅れまして、申し訳ございません。", "おくれまして、もうしわけございません。", "Okuremashite, mōshiwake gozaimasen.", "I am late. I am at fault."]
    ),
    "ご指摘のとおりです — it is as you pointed out": pair(
      ["ご指摘のとおりです。森が減っています。", "ごしてきのとおりです。もりがへっています。", "Goshiteki no tōri desu. Mori ga hette imasu.", "It is as you pointed out. The forest is shrinking."],
      ["ご指摘のとおりです。数が違います。", "ごしてきのとおりです。かずがちがいます。", "Goshiteki no tōri desu. Kazu ga chigaimasu.", "It is as you pointed out. The count is wrong."]
    ),
    "再発防止は～です — what stops a repeat is": pair(
      ["再発防止は毎月の検査です。", "さいはつぼうしはまいげつのけんさです。", "Saihatsu bōshi wa maigetsu no kensa desu.", "What stops a repeat is the monthly test."],
      ["再発防止は二重の確認です。", "さいはつぼうしはにじゅうのかくにんです。", "Saihatsu bōshi wa nijū no kakunin desu.", "What stops a repeat is checking twice."]
    ),
    "～という理解で合っていますか — say it back": pair(
      ["びんだけを使うという理解で合っていますか。", "びんだけをつかうというりかいであっていますか。", "Bin dake o tsukau to iu rikai de atte imasu ka.", "Let me say it back: we use only bottles. Is that right?"],
      ["来月始めるという理解で合っていますか。", "らいげつはじめるというりかいであっていますか。", "Raigetsu hajimeru to iu rikai de atte imasu ka.", "Let me say it back: we start next month. Is that right?"]
    ),
    "～ところです — say where the work is": pair(
      ["今、調べているところです。", "いま、しらべているところです。", "Ima, shirabete iru tokoro desu.", "The work is in the middle of the investigation."],
      ["たった今終わったところです。", "たったいまおわったところです。", "Tatta ima owatta tokoro desu.", "The work has just finished."]
    ),
    "確認させていただきます — close on your action": pair(
      ["日程を確認させていただきます。", "にっていをかくにんさせていただきます。", "Nittei o kakunin sasete itadakimasu.", "I will confirm the schedule, and that closes my action."],
      ["本数を確認させていただきます。", "ほんすうをかくにんさせていただきます。", "Honsū o kakunin sasete itadakimasu.", "I will confirm the number of trees, and that closes my action."]
    ),
    "～だけでなく、～も — not only, but also": pair(
      ["森だけでなく、川も守ります。", "もりだけでなく、かわもまもります。", "Mori dake de naku, kawa mo mamorimasu.", "We protect not only the forest, but also the river."],
      ["びんだけでなく、袋も減らします。", "びんだけでなく、ふくろもへらします。", "Bin dake de naku, fukuro mo herashimasu.", "We reduce not only bottles, but also bags."]
    ),
    "現状値は～、目標値は～ — now, and the target": pair(
      ["現状値は百本、目標値は三百本です。", "げんじょうちはひゃっぽん、もくひょうちはさんびゃっぽんです。", "Genjōchi wa hyappon, mokuhyōchi wa sanbyappon desu.", "Now, one hundred trees. The target is three hundred."],
      ["現状値は二割、目標値は五割です。", "げんじょうちはにわり、もくひょうちはごわりです。", "Genjōchi wa niwari, mokuhyōchi wa gowari desu.", "Now, two tenths. The target is half."]
    ),
    "副経路は次回です — the side route waits": pair(
      ["副経路は次回です。", "ふくけいろはじかいです。", "Fuku-keiro wa jikai desu.", "The side route waits until next time."],
      ["海の調査は副経路で、次回です。", "うみのちょうさはふくけいろで、じかいです。", "Umi no chōsa wa fuku-keiro de, jikai desu.", "The sea survey is the side route, and it waits."]
    ),
    "～一方で、～ — and on the other side": pair(
      ["森は増えています。一方で、川はまだ汚れています。", "もりはふえています。いっぽうで、かわはまだよごれています。", "Mori wa fuete imasu. Ippō de, kawa wa mada yogorete imasu.", "The forest is growing. On the other side, the river is still dirty."],
      ["びんは減りました。一方で、袋は残っています。", "びんはへりました。いっぽうで、ふくろはのこっています。", "Bin wa herimashita. Ippō de, fukuro wa nokotte imasu.", "The bottles decreased. On the other side, the bags remain."]
    ),
    "明示しないものは、含みません — what is not stated is not included": pair(
      ["明示しないものは、含みません。海は含みません。", "めいじしないものは、ふくみません。うみはふくみません。", "Meiji shinai mono wa, fukumimasen. Umi wa fukumimasen.", "What is not stated is not included. The sea is not included."],
      ["明示しない費用は、含みません。", "めいじしないひようは、ふくみません。", "Meiji shinai hiyō wa, fukumimasen.", "A cost that is not stated is not included."]
    ),
    "推奨案は～です — the option we recommend is": pair(
      ["推奨案は水筒です。", "すいしょうあんはすいとうです。", "Suishōan wa suitō desu.", "The option we recommend is the water bottle."],
      ["推奨案は北の森から始めることです。", "すいしょうあんはきたのもりからはじめることです。", "Suishōan wa kita no mori kara hajimeru koto desu.", "The option we recommend is to start from the north forest."]
    ),
    "～を踏まえて — based on": pair(
      ["調査を踏まえて、場所を決めます。", "ちょうさをふまえて、ばしょをきめます。", "Chōsa o fumaete, basho o kimemasu.", "Based on the survey, we decide the place."],
      ["ご意見を踏まえて、本数を変えます。", "ごいけんをふまえて、ほんすうをかえます。", "Goiken o fumaete, honsū o kaemasu.", "Based on your opinion, we change the number of trees."]
    ),
    "採用は～、見送りは～ — taken, and not taken": pair(
      ["採用は植林、見送りは新しい建物です。", "さいようはしょくりん、みおくりはあたらしいたてものです。", "Saiyō wa shokurin, miokuri wa atarashii tatemono desu.", "Taken: planting. Not taken: a new building."],
      ["採用はびん、見送りはプラスチックです。", "さいようはびん、みおくりはぷらすちっくです。", "Saiyō wa bin, miokuri wa purasuchikku desu.", "Taken: bottles. Not taken: plastic."]
    ),
    "その場で直す / 持ち帰って直す — fix here, or take it away": pair(
      ["その場で直します。", "そのばでなおします。", "Sono ba de naoshimasu.", "We fix it here."],
      ["持ち帰って直します。", "もちかえってなおします。", "Mochikaette naoshimasu.", "We take it away and fix it."]
    ),
    "～に沿って — in line with": pair(
      ["計画に沿って植えます。", "けいかくにそってうえます。", "Keikaku ni sotte uemasu.", "We plant in line with the plan."],
      ["規則に沿って水を出します。", "きそくにそってみずをだします。", "Kisoku ni sotte mizu o dashimasu.", "We release water in line with the rule."]
    ),
    "準拠です / 逸脱です — inside the line, or off it": pair(
      ["この作業は計画に準拠です。", "このさぎょうはけいかくにじゅんきょです。", "Kono sagyō wa keikaku ni junkyo desu.", "This work is inside the plan."],
      ["この排出は基準から逸脱です。", "このはいしゅつはきじゅんからいつだつです。", "Kono haishutsu wa kijun kara itsudatsu desu.", "This discharge is off the standard."]
    ),
    "口頭では変えません — speech does not change it": pair(
      ["口頭では範囲を変えません。", "こうとうでははんいをかえません。", "Kōtō de wa han'i o kaemasen.", "Speech does not change the scope."],
      ["口頭では日付を変えません。", "こうとうではひづけをかえません。", "Kōtō de wa hidzuke o kaemasen.", "Speech does not change the date."]
    ),
    "～次第です — it depends on": pair(
      ["開始は天気次第です。", "かいしはてんきしだいです。", "Kaishi wa tenki shidai desu.", "The start depends on the weather."],
      ["本数は予算次第です。", "ほんすうはよさんしだいです。", "Honsū wa yosan shidai desu.", "The number of trees depends on the budget."]
    ),
    "～次第、連絡します — as soon as it happens, I will write": pair(
      ["結果が出次第、連絡します。", "けっかがでしだい、れんらくします。", "Kekka ga deshidai, renraku shimasu.", "As soon as the result is out, I will write."],
      ["雨がやみ次第、連絡します。", "あめがやみしだい、れんらくします。", "Ame ga yamishidai, renraku shimasu.", "As soon as the rain stops, I will write."]
    ),
    "定時連絡は～です — the set-time message is": pair(
      ["定時連絡は毎朝九時です。", "ていじれんらくはまいあさくじです。", "Teiji renraku wa maiasa kuji desu.", "The set-time message is every morning at nine."],
      ["定時連絡は金曜の夕方です。", "ていじれんらくはきんようのゆうがたです。", "Teiji renraku wa kin'yō no yūgata desu.", "The set-time message is Friday evening."]
    ),
    "～所存です — I formally intend": pair(
      ["来月ご報告する所存です。", "らいげつごほうこくするしょぞんです。", "Raigetsu gohōkoku suru shozon desu.", "I formally intend to report next month."],
      ["森を守る所存です。", "もりをまもるしょぞんです。", "Mori o mamoru shozon desu.", "I formally intend to protect the forest."]
    ),
    "～をご提出いたします — I humbly submit": pair(
      ["報告書をご提出いたします。", "ほうこくしょをごていしゅついたします。", "Hōkokusho o goteishutsu itashimasu.", "I humbly submit the report."],
      ["計画をご提出いたします。", "けいかくをごていしゅついたします。", "Keikaku o goteishutsu itashimasu.", "I humbly submit the plan."]
    ),
    "検収のほど、お願いいたします — I ask for formal acceptance": pair(
      ["検収のほど、お願いいたします。", "けんしゅうのほど、おねがいいたします。", "Kenshū no hodo, onegai itashimasu.", "I ask for formal acceptance."],
      ["植林の検収のほど、お願いいたします。", "しょくりんのけんしゅうのほど、おねがいいたします。", "Shokurin no kenshū no hodo, onegai itashimasu.", "I ask for formal acceptance of the planting."]
    ),
    "事象は～ということです — the observation is": pair(
      ["事象は川が濁ったということです。", "じしょうはかわがにごったということです。", "Jishō wa kawa ga nigotta to iu koto desu.", "The observation is that the river turned cloudy."],
      ["事象は数が足りないということです。", "じしょうはかずがたりないということです。", "Jishō wa kazu ga tarinai to iu koto desu.", "The observation is that the count is short."]
    ),
    "今は～ところです — where this ticket is": pair(
      ["今は調べているところです。", "いまはしらべているところです。", "Ima wa shirabete iru tokoro desu.", "This item is in the middle of the investigation."],
      ["今は直したところです。", "いまはなおしたところです。", "Ima wa naoshita tokoro desu.", "This item has just been fixed."]
    ),
    "対応を確認させていただきます — I will confirm the response": pair(
      ["対応を確認させていただきます。", "たいおうをかくにんさせていただきます。", "Taiō o kakunin sasete itadakimasu.", "I will confirm the response."],
      ["明日の作業を確認させていただきます。", "あしたのさぎょうをかくにんさせていただきます。", "Ashita no sagyō o kakunin sasete itadakimasu.", "I will confirm tomorrow's work."]
    )
  };

  function points(text) {
    var raw = String(text || "").replace(/\s+/g, " ").trim();
    if (!raw) {
      return { items: ["Read the examples, then say the pattern in your own sentence."], more: false };
    }
    var bits = raw.split(/(?<=。)\s*|(?<=\.)\s+(?=[A-Z\u3040-\u30ff\u4e00-\u9fff])/).map(function (part) {
      return part.trim();
    }).filter(function (part) {
      return part.length > 1;
    });
    if (!bits.length) bits = [raw];
    return { items: bits.slice(0, 3), more: bits.length > 3 };
  }

  window.JapaneseStudyGrammar = {
    points: points,
    green: function (title) {
      return book[title] || [];
    },
    titles: function () {
      return Object.keys(book);
    }
  };
})();
