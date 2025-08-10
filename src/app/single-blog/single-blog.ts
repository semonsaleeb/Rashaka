import { Component, OnInit } from '@angular/core';
import { Blog, BlogService } from '../services/blogs.service';
import { ActivatedRoute, RouterModule } from '@angular/router';


@Component({
  selector: 'app-single-blog',
  imports: [RouterModule],
  templateUrl: './single-blog.html',
  styleUrl: './single-blog.scss'
})
export class SingleBlog implements OnInit {
  blog: Blog | null = null;
  isLoading = true;
  errorMessage = '';
blogHtml: string = '';

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.blogService.getBlogById(id).subscribe({
        next: (data) => {
          this.blogHtml = this.parseContent(data.content_ar);
          this.blog = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isLoading = false;
        }
      });
    }
  }

 parseContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    let html = '';
    let inList = false;

    parsed.ops.forEach((op: any) => {
      const attrs = op.attributes || {};
      let text = op.insert;

      // Skip newlines and empty strings
      if (text === '\n') return;

      if (attrs.bold) {
        text = `<strong>${text}</strong>`;
      }

      if (attrs.color) {
        text = `<span style="color:${attrs.color}">${text}</span>`;
      }

      if (attrs.header === 1) {
        html += `<h1>${text}</h1>`;
        return;
      } else if (attrs.header === 2) {
        html += `<h2>${text}</h2>`;
        return;
      } else if (attrs.header === 3) {
        html += `<h3>${text}</h3>`;
        return;
      }

      // Bullet list
      if (attrs.list === 'bullet') {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${text}</li>`;
        return;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
      }

      // Inline text
      html += `<span>${text}</span>`;
    });

    // Close list if open
    if (inList) {
      html += '</ul>';
    }

    return html;
  } catch (err) {
    console.error('Delta parse error:', err);
    return content;
  }
}

}