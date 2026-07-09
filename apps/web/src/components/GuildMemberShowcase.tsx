import fireMage from "../assets/member-fire-mage.png";
import paladin from "../assets/member-paladin.png";
import priest from "../assets/member-priest.png";
import { SectionTitle } from "./SectionTitle";

const members = [
  {
    name: "火的很蒂法",
    role: "侏儒法师",
    tag: "火焰 / 爆发",
    image: fireMage,
    position: "50% 18%",
  },
  {
    name: "灰烬之心",
    role: "圣骑士",
    tag: "防护 / 神圣",
    image: paladin,
    position: "58% 10%",
  },
  {
    name: "清风袭人",
    role: "牧师",
    tag: "治疗 / 信仰",
    image: priest,
    position: "54% 14%",
  },
];

export function GuildMemberShowcase() {
  return (
    <section className="space-y-3">
      <SectionTitle eyebrow="Members" title="工会成员图鉴" />
      <div className="grid gap-3 md:grid-cols-3">
        {members.map((member) => (
          <article className="guild-card overflow-hidden p-0" key={member.name}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                alt={`${member.name} 成员形象`}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                src={member.image}
                style={{ objectPosition: member.position }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-guild-ink/85 via-guild-ink/40 to-transparent p-4 text-white">
                <p className="text-xs font-semibold opacity-80">{member.role}</p>
                <h3 className="mt-1 text-xl font-black">{member.name}</h3>
                <p className="mt-1 text-xs opacity-85">{member.tag} · 轻微腹肌训练痕迹</p>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="px-1 text-xs leading-5 text-guild-muted">
        当前作为工会成员展示图使用，页面中只裁切展示角色主体；正式部署前建议保留无第三方标识、无版权字样的版本。
      </p>
    </section>
  );
}
