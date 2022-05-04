#[derive(Debug, Clone)]
pub struct  AInstruction {
    pub value: String,
}

#[derive(Debug, Clone)]
pub struct  CInstruction {
    pub comp: String,
    pub dest: Option<String>,
    pub jump: Option<String>,
}

#[derive(Debug, Clone)]
pub struct  Label {
    pub name: String,
}
enum HackLine {
    Comment(String),
    AInstruction(AInstruction),
    Label(Label),
    CInstruction(CInstruction),
}

#[derive(Debug, Clone)]
pub enum HackInstruction {
    AInstruction(AInstruction),
    CInstruction(CInstruction),
}

#[derive(Debug)]
pub struct LabeledLine {
    pub instruction: HackInstruction,
    pub labels: Vec<Label>,
}

fn parse_line(line: &str) -> Option<HackLine> {
    let line = line.trim();
    if line.is_empty() {
        return None;
    }
    if line.starts_with("//") {
        return Some(HackLine::Comment(line[2..].to_string()));
    }
    if line.starts_with("@") {
        let value = line[1..].to_string();
        return Some(HackLine::AInstruction(AInstruction { value }));
    }
    if line.starts_with("(") {
        let name = line[1..line.len() - 1].to_string();
        return Some(HackLine::Label(Label { name }));
    }
    let split_at_eq = line.split("=").collect::<Vec<&str>>();
    let eq_len = split_at_eq.len();
    let dest = if eq_len == 1 { None } else { Some(split_at_eq[0].to_string()) };
    let split_at_semi = split_at_eq[eq_len - 1].split(";").collect::<Vec<&str>>();
    let jump = if split_at_semi.len() == 1 { None } else { Some(split_at_semi[1].to_string()) };
    let comp = split_at_semi[0].to_string();

    Some(HackLine::CInstruction(CInstruction { comp, dest, jump }))
}

pub fn parse_lines(lines: &[String]) -> Vec<LabeledLine> {
    let mut parsed = lines.iter().filter_map(|line| parse_line(line));
    let mut with_labels = Vec::new();
    let mut labels_stack = Vec::new();
    loop {
        let cur_cmd = parsed.next();
        match cur_cmd {
            Some(HackLine::Comment(_)) => continue,
            Some(HackLine::Label(label)) => {
                labels_stack.push(label);
            }
            Some(line) => {
                with_labels.push(LabeledLine {
                    labels: labels_stack.clone(),
                    instruction: match line {
                        HackLine::AInstruction(i) => HackInstruction::AInstruction(i),
                        HackLine::CInstruction(i) => HackInstruction::CInstruction(i),
                        _ => panic!("this won't happen because we've already tested for label in the surrounding match (famous last words)"),
                    }
                });
                labels_stack = Vec::new(); // reset the label accumulator
            },
            None => break,
        }
    }
    with_labels
}